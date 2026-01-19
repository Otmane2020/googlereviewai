import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Star, 
  Search, 
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Copy,
  CheckCircle,
  Clock,
  MessageSquare
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
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const { syncReviews, isSyncing } = useSyncGoogleReviews();

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    const [businessesRes, reviewsRes, profileRes] = await Promise.all([
      supabase.from("businesses").select("id, name, google_place_id").eq("user_id", user.id).eq("is_active", true),
      supabase.from("reviews").select("*").eq("user_id", user.id).order("review_date", { ascending: false }),
      supabase.from("profiles").select("credits").eq("id", user.id).single()
    ]);

    setBusinesses(businessesRes.data || []);
    setReviews(reviewsRes.data || []);
    setUserCredits(profileRes.data?.credits || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  const generateAIResponse = async (reviewId: number) => {
    if (!user) return;
    setGeneratingId(reviewId);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-response", {
        body: { reviewId, userId: user.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Réponse générée !", description: `Crédits restants: ${data.credits_remaining}` });
      fetchData();
    } catch (error) {
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible de générer la réponse.", variant: "destructive" });
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
        toast({ title: "Token Google manquant", description: "Reconnectez-vous avec Google.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("publish-google-reply", {
        body: { review_id: reviewId, provider_token: session.provider_token },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Publié sur Google !" });
      fetchData();
    } catch (error) {
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible de publier.", variant: "destructive" });
    } finally {
      setPublishingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié !" });
  };

  // Filters
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRating = filterRating === "all" || review.rating === parseInt(filterRating);
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "pending" && !review.ai_response) ||
      (filterStatus === "ready" && review.ai_response && !review.published_to_google) ||
      (filterStatus === "published" && review.published_to_google);
    return matchesSearch && matchesRating && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRating, filterStatus]);

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.ai_response).length,
    ready: reviews.filter(r => r.ai_response && !r.published_to_google).length,
    published: reviews.filter(r => r.published_to_google).length,
  };

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

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Avis Google</h1>
              <p className="text-muted-foreground text-sm mt-1">Gérez et répondez à vos avis clients</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1.5">
                <Star className="w-4 h-4 mr-1 text-accent fill-accent" />
                {userCredits} crédits
              </Badge>
              <Button onClick={() => syncReviews()} disabled={isSyncing} size="sm">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Synchroniser</span>
              </Button>
              {user && <AddTestReviewDialog userId={user.id} businesses={businesses} onReviewAdded={fetchData} />}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "En attente", value: stats.pending, color: "text-orange-500" },
              { label: "Prêts", value: stats.ready, color: "text-primary" },
              { label: "Publiés", value: stats.published, color: "text-secondary" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background rounded-lg p-3 text-center border border-border">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Note" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Toutes notes</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={r.toString()}>{r} étoiles</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="ready">Prêts</SelectItem>
              <SelectItem value="published">Publiés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {paginatedReviews.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Aucun avis</h2>
            <p className="text-muted-foreground text-sm">
              {reviews.length === 0 ? "Synchronisez vos avis Google pour commencer." : "Aucun résultat pour ces filtres."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                    {review.author.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{review.author}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.review_date).toLocaleDateString("fr-FR")}
                      </span>
                      {/* Status Badge */}
                      {review.published_to_google ? (
                        <Badge variant="secondary" className="text-xs gap-1"><CheckCircle className="w-3 h-3" /> Publié</Badge>
                      ) : review.ai_response ? (
                        <Badge className="text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20"><Sparkles className="w-3 h-3" /> Prêt</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" /> En attente</Badge>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{review.comment}</p>
                    )}

                    {/* AI Response */}
                    {review.ai_response && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
                          <Sparkles className="w-3 h-3" /> Réponse IA
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{review.ai_response}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {!review.ai_response ? (
                        <Button size="sm" onClick={() => generateAIResponse(review.id)} disabled={generatingId === review.id}>
                          {generatingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          <span className="ml-1.5">Générer</span>
                        </Button>
                      ) : !review.published_to_google ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => publishToGoogle(review.id)} disabled={publishingId === review.id}>
                            {publishingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span className="ml-1.5">Publier</span>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(review.ai_response!)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => generateAIResponse(review.id)} disabled={generatingId === review.id}>
                            <RefreshCw className={`w-4 h-4 ${generatingId === review.id ? "animate-spin" : ""}`} />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(review.ai_response!)}>
                          <Copy className="w-4 h-4 mr-1.5" /> Copier
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {currentPage} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reviews;