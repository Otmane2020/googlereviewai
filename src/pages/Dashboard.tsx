import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import { useSyncGoogleReviews } from "@/hooks/useSyncGoogleReviews";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Building2, 
  MessageSquare,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Coins,
  LayoutDashboard,
  Loader2
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  plan_id: string;
  trial_end: string | null;
  onboarding_completed: boolean;
  credits: number;
  max_businesses: number;
  plan_name: string;
}

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string | null;
  review_date: string;
  ai_response: string | null;
  location_id: string;
}

interface StatsCard {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
  color: string;
}

const REVIEWS_PER_PAGE = 10;

const Dashboard = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [businessCount, setBusinessCount] = useState(0);
  const [reviewStats, setReviewStats] = useState({ total: 0, avgRating: 0, aiResponses: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { syncBusinesses, isSyncing: isSyncingBusinesses } = useSyncGoogleBusinesses();
  const { syncReviews, isSyncing: isSyncingReviews } = useSyncGoogleReviews();
  const hasSyncedRef = useRef(false);

  const fetchAllReviews = useCallback(async () => {
    if (!user) return;
    setLoadingReviews(true);
    setLoadProgress(10);

    // First get count
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setLoadProgress(30);

    // Fetch all reviews
    const { data, error } = await supabase
      .from("reviews")
      .select("id, author, rating, comment, review_date, ai_response, location_id")
      .eq("user_id", user.id)
      .order("review_date", { ascending: false });

    setLoadProgress(70);

    if (!error && data) {
      setAllReviews(data);
      const total = data.length;
      const avgRating = total > 0 ? data.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      const aiResponses = data.filter(r => r.ai_response).length;
      setReviewStats({ total, avgRating: Number(avgRating.toFixed(1)), aiResponses });
    }

    setLoadProgress(100);
    setTimeout(() => setLoadingReviews(false), 300);
  }, [user]);

  const fetchBusinessCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);
    
    setBusinessCount(count || 0);
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
    fetchAllReviews();
    fetchBusinessCount();
  }, [user, navigate, fetchAllReviews, fetchBusinessCount]);

  // Auto-sync Google businesses and reviews on first load if user signed in with Google
  useEffect(() => {
    const autoSync = async () => {
      if (!loading && user && session?.provider_token && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        await syncBusinesses();
        await syncReviews();
        fetchAllReviews();
        fetchBusinessCount();
      }
    };
    autoSync();
  }, [loading, user, session, syncBusinesses, syncReviews, fetchAllReviews, fetchBusinessCount]);

  const isSyncing = isSyncingBusinesses || isSyncingReviews;

  // Pagination
  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = allReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  const stats: StatsCard[] = [
    { title: "Crédits", value: profile?.credits ?? 0, change: "", icon: Coins, trend: "neutral", color: "bg-accent" },
    { title: "Note moyenne", value: reviewStats.avgRating || "-", change: "", icon: TrendingUp, trend: "neutral", color: "bg-emerald-500" },
    { title: "Réponses IA", value: reviewStats.aiResponses, change: `/${reviewStats.total}`, icon: MessageSquare, trend: "neutral", color: "bg-blue-500" },
    { title: "Établissements", value: businessCount, change: `/${profile?.max_businesses === -1 ? "∞" : profile?.max_businesses ?? 1}`, icon: Building2, trend: "neutral", color: "bg-violet-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bonjour, {profile?.full_name?.split(" ")[0] || "👋"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Voici vos statistiques du jour
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Trial banner */}
        {profile?.subscription_status === "trial" && (
          <div className="gradient-hero rounded-2xl p-4 lg:p-6 text-card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Essai gratuit</h3>
                <p className="text-card/80 text-sm lg:text-base">
                  14 jours restants. Profitez de toutes les fonctionnalités !
                </p>
              </div>
              <Button variant="hero" size="lg" className="w-full lg:w-auto">
                Passer à Pro
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-card rounded-2xl p-4 lg:p-6 border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <span
                  className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-full ${
                    stat.trend === "up"
                      ? "bg-secondary/10 text-secondary"
                      : stat.trend === "down"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</h3>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/reviews"
              className="bg-card rounded-2xl p-5 border border-border hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Voir les avis</h3>
              <p className="text-sm text-muted-foreground">Consultez et répondez à vos avis</p>
            </Link>
            
            <Link
              to="/ai-settings"
              className="bg-card rounded-2xl p-5 border border-border hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Configurer l'IA</h3>
              <p className="text-sm text-muted-foreground">Personnalisez vos réponses automatiques</p>
            </Link>
            
            <Link
              to="/businesses"
              className="bg-card rounded-2xl p-5 border border-border hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Ajouter un établissement</h3>
              <p className="text-sm text-muted-foreground">Connectez un nouveau business</p>
            </Link>
          </div>
        </div>

        {/* All reviews with pagination */}
        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Tous les avis</h2>
              <span className="text-sm text-muted-foreground">
                ({reviewStats.total} avis)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { syncBusinesses(); syncReviews().then(() => fetchAllReviews()); }}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Synchroniser</span>
              </Button>
              <Link to="/reviews">
                <Button variant="ghost" size="sm">
                  Gérer
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Loading progress bar */}
          {loadingReviews && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Chargement des avis...</p>
                  <Progress value={loadProgress} className="h-2" />
                </div>
                <span className="text-sm font-medium text-foreground">{loadProgress}%</span>
              </div>
            </div>
          )}

          {!loadingReviews && paginatedReviews.length > 0 ? (
            <>
              <div className="divide-y divide-border">
                {paginatedReviews.map((review) => (
                  <div key={review.id} className="p-4 lg:p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{review.author}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "text-accent fill-accent" : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.comment || "Aucun commentaire"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.review_date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {review.ai_response ? (
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full whitespace-nowrap">
                          Répondu
                        </span>
                      ) : (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Précédent
                    </Button>
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
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
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            className="w-8 h-8 p-0"
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
                </div>
              )}
            </>
          ) : !loadingReviews ? (
            <div className="p-6 lg:p-8">
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-foreground mb-2">Aucun avis pour le moment</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez votre compte Google My Business
                </p>
                <Button variant="default" onClick={() => { syncBusinesses(); syncReviews(); }} disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    "Synchroniser Google"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;