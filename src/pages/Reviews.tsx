import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ReviewCard } from "@/components/ReviewCard";
import { AutoResponseToggle } from "@/components/AutoResponseToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Star, 
  Search, 
  Loader2,
  TestTube,
  RefreshCw,
  Building2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Coins,
  Filter
} from "lucide-react";
import { AddTestReviewDialog } from "@/components/AddTestReviewDialog";
import { useSyncGoogleReviews } from "@/hooks/useSyncGoogleReviews";
import { SyncStatusCard } from "@/components/SyncStatusCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

interface UserCredits {
  credits: number;
  plan_name: string | null;
}

const REVIEWS_PER_PAGE = 10;

const Reviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterBusiness, setFilterBusiness] = useState<string>(searchParams.get("business") || "all");
  const [filterNoResponse, setFilterNoResponse] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const { syncReviews, isSyncing, lastSyncResult } = useSyncGoogleReviews();

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

  const fetchUserCredits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("credits, plan_name")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setUserCredits(data);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReviews();
    fetchBusinesses();
    fetchUserCredits();

    // Subscribe to realtime updates
    const reviewsChannel = supabase
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

    // Subscribe to credits updates
    const creditsChannel = supabase
      .channel("credits-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setUserCredits((prev) => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(creditsChannel);
    };
  }, [user, navigate, fetchReviews, fetchBusinesses, fetchUserCredits]);

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
        description: `Crédits restants: ${data.credits_remaining}`,
      });

      fetchReviews();
      fetchUserCredits();
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

  // Stats
  const totalReviews = reviews.length;
  const pendingReviews = reviews.filter(r => !r.ai_response && !r.replied).length;
  const publishedReviews = reviews.filter(r => r.published_to_google).length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />

      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Star className="w-6 h-6 text-accent fill-accent" />
                Gestion des Avis Google
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez et répondez à vos avis clients avec l'IA
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Credits indicator */}
              {userCredits && (
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="w-5 h-5 text-accent" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-foreground">{userCredits.credits}</span>
                    <span className="text-xs text-muted-foreground">crédits</span>
                  </div>
                </div>
              )}

              {/* Auto-response toggle */}
              <AutoResponseToggle />
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-foreground">{totalReviews}</div>
              <div className="text-sm text-muted-foreground">Total avis</div>
            </div>
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-accent flex items-center gap-1">
                {avgRating}
                <Star className="w-5 h-5 fill-accent" />
              </div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-primary">{pendingReviews}</div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-secondary">{publishedReviews}</div>
              <div className="text-sm text-muted-foreground">Publiés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test mode banner */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <TestTube className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Mode test :</strong> Ajoutez des avis fictifs pour tester
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
                Google Business
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Sync Status */}
        <SyncStatusCard lastSyncResult={lastSyncResult} />

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Sync and business filter */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
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
                {isSyncing ? "Synchronisation..." : "Synchroniser"}
              </Button>

              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Select value={filterBusiness} onValueChange={setFilterBusiness}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Tous les établissements" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
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

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un avis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Rating filters */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
              <Filter className="w-4 h-4" />
              Filtrer:
            </span>
            {[null, 5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating ?? "all"}
                variant={filterRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(rating)}
                className="h-8"
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
              className="gap-1 h-8"
            >
              <MessageCircle className="w-3 h-3" />
              Sans réponse
              {pendingReviews > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {pendingReviews}
                </Badge>
              )}
            </Button>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
            <span>
              {filteredReviews.length} avis trouvé{filteredReviews.length > 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <span>Page {currentPage} sur {totalPages}</span>
            )}
          </div>
        </div>

        {/* Reviews list */}
        {filteredReviews.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {reviews.length === 0 ? "Aucun avis" : "Aucun résultat"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {reviews.length === 0
                ? "Synchronisez vos avis Google ou ajoutez des avis de test."
                : "Essayez de modifier vos filtres de recherche."}
            </p>
            {reviews.length === 0 && (
              <Button onClick={handleSyncReviews} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Synchroniser les avis
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                businessName={getBusinessName(review.location_id)}
                onGenerateResponse={generateAIResponse}
                onPublishToGoogle={publishToGoogle}
                onCopyToClipboard={copyToClipboard}
                isGenerating={generatingId === review.id}
                isPublishing={publishingId === review.id}
                creditsRemaining={userCredits?.credits}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
