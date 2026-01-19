import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Star, 
  Search, 
  MessageSquare, 
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  TestTube,
  RefreshCw,
  Building2,
  Filter,
  Send,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from "lucide-react";
import { AddTestReviewDialog } from "@/components/AddTestReviewDialog";
import { useSyncGoogleReviews } from "@/hooks/useSyncGoogleReviews";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id: number;
  review_id: string;
  location_id: string;
  author: string;
  rating: number;
  comment: string;
  review_date: string;
  replied: boolean;
  ai_response: string | null;
  published_to_google: boolean | null;
  published_at: string | null;
  google_reply?: string | null;
}

interface Business {
  id: string;
  name: string;
  google_place_id: string | null;
}

const REVIEWS_PER_PAGE = 10;


const Reviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterBusiness, setFilterBusiness] = useState<string>(searchParams.get("business") || "all");
  const [filterNoResponse, setFilterNoResponse] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const { syncReviews, isSyncing } = useSyncGoogleReviews();

  const fetchBusinesses = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, google_place_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching businesses:", error);
    } else {
      setBusinesses(data || []);
    }
  }, [user]);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("review_date", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReviews();
    fetchBusinesses();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("reviews-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, fetchReviews, fetchBusinesses]);

  // If /reviews?business=... was passed as a business UUID, convert it to the location_id (google_place_id)
  useEffect(() => {
    if (filterBusiness === "all" || filterBusiness === "test_location") return;
    if (businesses.length === 0) return;

    const byId = businesses.find((b) => b.id === filterBusiness);
    if (byId?.google_place_id) {
      setFilterBusiness(byId.google_place_id);
    }
  }, [businesses, filterBusiness]);

  const handleSyncReviews = async () => {
    const businessId =
      filterBusiness === "all" || filterBusiness === "test_location"
        ? undefined
        : businesses.find((b) => b.google_place_id === filterBusiness)?.id;

    await syncReviews(businessId);
    fetchReviews();
  };

  // Helper to get business name from location_id
  const getBusinessName = (locationId: string) => {
    if (locationId === "test_location") return "Avis de test";
    const business = businesses.find((b) => b.google_place_id === locationId);
    return business?.name || "Établissement";
  };

  const generateAIResponse = async (reviewId: number) => {
    if (!user) return;
    setGeneratingId(reviewId);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-response", {
        body: { reviewId, userId: user.id },
      });

      if (error) throw error;

      if (data?.error) {
        // Handle credits error specifically
        if (data.credits !== undefined && data.credits < 1) {
          toast({
            title: "Crédits insuffisants",
            description: "Rechargez votre compte pour continuer à générer des réponses.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast({
        title: "Réponse générée !",
        description: `La réponse IA a été créée. Crédits restants: ${data.credits_remaining}`,
      });

      fetchReviews();
    } catch (error) {
      console.error("Error generating AI response:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer la réponse.",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const publishToGoogle = async (reviewId: number) => {
    if (!user) return;
    setPublishingId(reviewId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        toast({
          title: "Token Google manquant",
          description: "Veuillez vous déconnecter et vous reconnecter avec Google.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("publish-google-reply", {
        body: { review_id: reviewId, provider_token: session.provider_token },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error || data.message);
      }

      toast({
        title: "Publié sur Google !",
        description: "La réponse a été publiée sur Google Business Profile.",
      });

      fetchReviews();
    } catch (error) {
      console.error("Error publishing to Google:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de publier sur Google.",
        variant: "destructive",
      });
    } finally {
      setPublishingId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copié !",
        description: "La réponse a été copiée dans le presse-papier.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le texte.",
        variant: "destructive",
      });
    }
  };

  const openGoogleReviews = () => {
    window.open("https://business.google.com/reviews", "_blank");
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRating = filterRating === null || review.rating === filterRating;

    // filterBusiness stores a location_id value (google_place_id) or 'all'/'test_location'
    const matchesBusiness = filterBusiness === "all" || review.location_id === filterBusiness;

    const matchesNoResponse = !filterNoResponse || (!review.ai_response && !review.replied);
    return matchesSearch && matchesRating && matchesBusiness && matchesNoResponse;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRating, filterBusiness, filterNoResponse]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-accent fill-accent" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Avis Google</h1>
              <p className="text-sm text-muted-foreground">
                Gérez et répondez à vos avis clients
              </p>
            </div>
          </div>
          <StarlinkoLogo showBadge={false} />
        </div>
      </header>

      {/* Test mode banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <TestTube className="w-4 h-4 text-primary" />
            <span>
              <strong>Mode test :</strong> Ajoutez des avis fictifs pour tester la génération de réponses IA
            </span>
          </div>
          <div className="flex gap-2">
            {user && (
              <AddTestReviewDialog
                userId={user.id}
                businesses={businesses}
                defaultLocationId={filterBusiness !== "all" ? filterBusiness : undefined}
                onReviewAdded={fetchReviews}
              />
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={openGoogleReviews}>
              <ExternalLink className="w-4 h-4" />
              Ouvrir Google Avis
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Sync and Filters */}
        <div className="flex flex-col gap-4">
          {/* Sync button and business filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleSyncReviews}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isSyncing ? "Synchronisation..." : "Synchroniser les avis Google"}
              </Button>
            </div>
            
            {/* Business filter */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <Select value={filterBusiness} onValueChange={setFilterBusiness}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Tous les établissements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les établissements</SelectItem>
                  <SelectItem value="test_location">Avis de test</SelectItem>
                  {businesses
                    .filter((b) => !!b.google_place_id)
                    .map((business) => (
                      <SelectItem key={business.id} value={business.google_place_id!}>
                        {business.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search and rating filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un avis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[null, 5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating ?? "all"}
                  variant={filterRating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRating(rating)}
                >
                  {rating === null ? (
                    "Tous"
                  ) : (
                    <span className="flex items-center gap-1">
                      {rating} <Star className="w-3 h-3 fill-current" />
                    </span>
                  )}
                </Button>
              ))}
              <Button
                variant={filterNoResponse ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterNoResponse(!filterNoResponse)}
                className="gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                Sans réponse
              </Button>
            </div>
          </div>

          {/* Results count and pagination info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredReviews.length} avis trouvé{filteredReviews.length > 1 ? 's' : ''}
              {filterNoResponse && ' sans réponse'}
            </span>
            {totalPages > 1 && (
              <span>Page {currentPage} sur {totalPages}</span>
            )}
          </div>
        </div>

        {/* Reviews list */}
        {filteredReviews.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {reviews.length === 0 ? "Aucun avis" : "Aucun résultat"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {reviews.length === 0
                ? "Connectez votre compte Google My Business pour synchroniser vos avis."
                : "Essayez de modifier vos filtres de recherche."}
            </p>
            {reviews.length === 0 && (
              <Button>Connecter Google My Business</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedReviews.map((review) => (
              <div
                key={review.id}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {review.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{review.author}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(review.review_date).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {getBusinessName(review.location_id)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.replied ? (
                      <span className="flex items-center gap-1 text-sm text-secondary">
                        <CheckCircle className="w-4 h-4" />
                        Répondu
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <XCircle className="w-4 h-4" />
                        En attente
                      </span>
                    )}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-muted-foreground mb-4">{review.comment}</p>
                )}

                {review.ai_response && (
                  <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/20 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-secondary text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        Réponse IA
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-7 text-xs"
                        onClick={() => copyToClipboard(review.ai_response!)}
                      >
                        <Copy className="w-3 h-3" />
                        Copier
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">{review.ai_response}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => generateAIResponse(review.id)}
                    disabled={generatingId === review.id}
                  >
                    {generatingId === review.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generatingId === review.id ? "Génération..." : "Générer une réponse"}
                  </Button>
                  
                  {review.ai_response && !review.published_to_google && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => publishToGoogle(review.id)}
                      disabled={publishingId === review.id}
                    >
                      {publishingId === review.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {publishingId === review.id ? "Publication..." : "Publier sur Google"}
                    </Button>
                  )}
                  
                  {review.published_to_google && (
                    <span className="flex items-center gap-1 text-sm text-secondary px-3 py-1.5 bg-secondary/10 rounded-md">
                      <CheckCheck className="w-4 h-4" />
                      Publié sur Google
                    </span>
                  )}
                  
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Répondre manuellement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-10"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reviews;
