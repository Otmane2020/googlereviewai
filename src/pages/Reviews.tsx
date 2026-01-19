import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
  MessageSquare,
  Building2
} from "lucide-react";
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
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const { syncReviews, isSyncing } = useSyncGoogleReviews();

  // Load saved business selection from localStorage
  useEffect(() => {
    if (user) {
      const savedBusinessId = localStorage.getItem(`starlinko_selected_business_${user.id}`);
      if (savedBusinessId) {
        setSelectedBusinessId(savedBusinessId);
      }
    }
  }, [user]);

  // Save business selection to localStorage
  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId);
    if (user) {
      localStorage.setItem(`starlinko_selected_business_${user.id}`, businessId);
    }
    setCurrentPage(1);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    const [businessesRes, reviewsRes] = await Promise.all([
      supabase.from("businesses").select("id, name, google_place_id").eq("user_id", user.id).eq("is_active", true),
      supabase.from("reviews").select("*").eq("user_id", user.id).order("review_date", { ascending: false })
    ]);

    const businessesList = businessesRes.data || [];
    setBusinesses(businessesList);
    setReviews(reviewsRes.data || []);
    
    // Auto-select first business if none selected or saved selection not found
    if (businessesList.length > 0) {
      const savedBusinessId = localStorage.getItem(`starlinko_selected_business_${user.id}`);
      if (savedBusinessId && businessesList.some(b => b.id === savedBusinessId)) {
        setSelectedBusinessId(savedBusinessId);
      } else {
        setSelectedBusinessId(businessesList[0].id);
        localStorage.setItem(`starlinko_selected_business_${user.id}`, businessesList[0].id);
      }
    }
    
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

  // Get selected business
  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  // Filter reviews by selected business's google_place_id
  const businessReviews = useMemo(() => {
    if (!selectedBusiness?.google_place_id) return [];
    return reviews.filter(r => r.location_id === selectedBusiness.google_place_id);
  }, [reviews, selectedBusiness]);

  // Filters
  const filteredReviews = businessReviews.filter((review) => {
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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRating, filterStatus, selectedBusinessId]);

  const stats = {
    total: businessReviews.length,
    pending: businessReviews.filter(r => !r.ai_response).length,
    ready: businessReviews.filter(r => r.ai_response && !r.published_to_google).length,
    published: businessReviews.filter(r => r.published_to_google).length,
  };

  // Calculate rating distribution for Google-style filter
  const ratingDistribution = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    businessReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  }, [businessReviews]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (businessReviews.length === 0) return 0;
    const sum = businessReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / businessReviews.length;
  }, [businessReviews]);

  // Handle sync with automatic token refresh
  const handleSync = async () => {
    const result = await syncReviews();
    if (result?.requires_reconnect) {
      toast({
        title: "Reconnexion requise",
        description: "Votre session Google a expiré. Veuillez vous reconnecter.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <DashboardHeader />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Google Logo */}
              <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Avis Google</h1>
                {selectedBusiness && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground text-sm">{selectedBusiness.name}</span>
                    {stats.total > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < Math.round(averageRating) ? "text-accent fill-accent" : "text-muted-foreground/30"}`} 
                              />
                            ))}
                          </div>
                          <span className="text-muted-foreground text-sm">({stats.total})</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSync} disabled={isSyncing} size="sm">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Synchroniser</span>
              </Button>
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
        {/* Business Selector */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Établissement sélectionné</p>
              <Select value={selectedBusinessId} onValueChange={handleBusinessChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un établissement" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Google-style Star Rating Filter */}
        {selectedBusinessId && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                  const percentage = businessReviews.length > 0 ? (count / businessReviews.length) * 100 : 0;
                  const isSelected = filterRating === rating.toString();
                  
                  return (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(isSelected ? "all" : rating.toString())}
                      className={`w-full flex items-center gap-3 p-1.5 rounded-lg transition-colors ${
                        isSelected ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm font-medium w-3">{rating}</span>
                      <Star className={`w-4 h-4 ${isSelected ? "text-accent fill-accent" : "text-accent fill-accent"}`} />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${isSelected ? "bg-primary" : "bg-accent"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </button>
                  );
                })}
              </div>
            
            {/* Search and Status Filters */}
            <div className="sm:w-64 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="ready">Prêts</SelectItem>
                  <SelectItem value="published">Publiés</SelectItem>
                </SelectContent>
              </Select>
              {filterRating !== "all" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground"
                  onClick={() => setFilterRating("all")}
                >
                  Réinitialiser le filtre
                </Button>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Reviews List */}
        {!selectedBusinessId ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Sélectionnez un établissement</h2>
            <p className="text-muted-foreground text-sm">
              Choisissez un établissement ci-dessus pour voir ses avis.
            </p>
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Aucun avis</h2>
            <p className="text-muted-foreground text-sm">
              {businessReviews.length === 0 ? "Synchronisez vos avis Google pour commencer." : "Aucun résultat pour ces filtres."}
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

      <MobileBottomNav />
    </div>
  );
};

export default Reviews;