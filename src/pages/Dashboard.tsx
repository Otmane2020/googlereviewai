import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import { useSyncGoogleReviews } from "@/hooks/useSyncGoogleReviews";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ConnectGMBDialog } from "@/components/ConnectGMBDialog";

import { Button } from "@/components/ui/button";
import { 
  Star, 
  Building2, 
  TrendingUp,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Loader2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Percent
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  subscription_status: string;
  credits: number;
  max_businesses: number;
  plan_name: string;
  trial_end: string | null;
}

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string | null;
  review_date: string;
  ai_response: string | null;
}

const Dashboard = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, aiResponses: 0, pending: 0, businesses: 0, responseRate: 0 });
  const [loading, setLoading] = useState(true);
  const [showGMBDialog, setShowGMBDialog] = useState(false);
  const { syncBusinesses, isSyncing: isSyncingBusinesses } = useSyncGoogleBusinesses();
  const { syncReviews, isSyncing: isSyncingReviews } = useSyncGoogleReviews();
  const hasSyncedRef = useRef(false);
  const hasCheckedGMBRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch all reviews with pagination to get accurate count
    let allReviews: Review[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author, rating, comment, review_date, ai_response")
        .eq("user_id", user.id)
        .order("review_date", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        allReviews = [...allReviews, ...data];
        hasMore = data.length === pageSize;
        page++;
      }
    }

    const [profileRes, businessesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("businesses").select("id", { count: "exact" }).eq("user_id", user.id).eq("is_active", true)
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    
    // Sort by pending first, then by date
    const sortedReviews = allReviews.sort((a, b) => {
      // Pending reviews first
      if (!a.ai_response && b.ai_response) return -1;
      if (a.ai_response && !b.ai_response) return 1;
      // Then by date
      return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
    });
    
    setRecentReviews(sortedReviews.slice(0, 5));
    
    const total = allReviews.length;
    const avgRating = total > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const aiResponses = allReviews.filter(r => r.ai_response).length;
    const pending = allReviews.filter(r => !r.ai_response).length;
    const responseRate = total > 0 ? Math.round((aiResponses / total) * 100) : 0;
    
    setStats({
      total,
      avgRating: Number(avgRating.toFixed(1)),
      aiResponses,
      pending,
      businesses: businessesRes.count || 0,
      responseRate
    });

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  useEffect(() => {
    const autoSync = async () => {
      if (!loading && user && session?.provider_token && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        await syncBusinesses();
        await syncReviews();
        fetchData();
      }
    };
    autoSync();
  }, [loading, user, session, syncBusinesses, syncReviews, fetchData]);

  // Check if user signed up with email (no Google provider) and show GMB dialog
  useEffect(() => {
    if (!loading && user && !hasCheckedGMBRef.current) {
      hasCheckedGMBRef.current = true;
      const isGoogleUser = user.app_metadata?.provider === "google" || session?.provider_token;
      const hasSeenGMBPrompt = localStorage.getItem(`gmb_prompt_${user.id}`);
      
      if (!isGoogleUser && !hasSeenGMBPrompt) {
        // Delay dialog to let page load
        setTimeout(() => {
          setShowGMBDialog(true);
          localStorage.setItem(`gmb_prompt_${user.id}`, "true");
        }, 1500);
      }
    }
  }, [loading, user, session]);

  const isSyncing = isSyncingBusinesses || isSyncingReviews;

  // Determine urgency colors
  const getUrgencyLevel = () => {
    if (stats.pending === 0) return "green";
    if (stats.pending <= 3) return "orange";
    return "red";
  };

  const getResponseRateColor = () => {
    if (stats.responseRate >= 80) return "green";
    if (stats.responseRate >= 50) return "orange";
    return "red";
  };

  const urgencyLevel = getUrgencyLevel();
  const responseRateColor = getResponseRateColor();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bienvenue,</p>
            <h1 className="text-xl font-bold text-foreground">{profile?.full_name?.split(" ")[0] || "👋"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center px-4 py-2 bg-primary/10 rounded-xl">
              <div className="text-lg font-bold text-primary">{profile?.credits || 0}</div>
              <div className="text-[10px] text-muted-foreground">Crédits</div>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-xl h-12 w-12"
              onClick={() => { syncBusinesses(); syncReviews().then(() => fetchData()); }}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Trial Banner */}
        {profile?.subscription_status === "trial" && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">Essai gratuit</p>
                <p className="text-xs text-muted-foreground">10 crédits offerts pour tester</p>
              </div>
              <Link to="/settings">
                <Button size="sm" variant="outline" className="rounded-xl text-xs">
                  Upgrade
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Urgency Card - Non répondu */}
        <Link to="/reviews" className="block">
          <div className={`relative overflow-hidden rounded-2xl p-5 transition-all ${
            urgencyLevel === "red" 
              ? "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30" 
              : urgencyLevel === "orange"
              ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30"
              : "bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30"
          }`}>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  {urgencyLevel === "green" ? (
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  ) : (
                    <AlertCircle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    {urgencyLevel === "green" ? "Tout est à jour !" : "Avis non répondus"}
                  </p>
                  <div className="text-3xl font-bold text-white">{stats.pending}</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/60" />
            </div>
          </div>
        </Link>

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Response Rate */}
          <div className={`rounded-2xl p-4 border ${
            responseRateColor === "green" 
              ? "bg-green-500/5 border-green-500/20" 
              : responseRateColor === "orange"
              ? "bg-orange-500/5 border-orange-500/20"
              : "bg-red-500/5 border-red-500/20"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Percent className={`w-4 h-4 ${
                responseRateColor === "green" ? "text-green-500" 
                : responseRateColor === "orange" ? "text-orange-500" 
                : "text-red-500"
              }`} />
              <span className="text-xs text-muted-foreground">Taux réponse</span>
            </div>
            <div className={`text-2xl font-bold ${
              responseRateColor === "green" ? "text-green-600" 
              : responseRateColor === "orange" ? "text-orange-600" 
              : "text-red-600"
            }`}>
              {stats.responseRate}%
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-muted-foreground">Note moyenne</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.avgRating || "-"}</div>
          </div>

          {/* Total Reviews */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total avis</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </div>

          {/* AI Responses */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Réponses IA</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.aiResponses}</div>
          </div>
        </div>

        {/* Quick Actions - Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3 min-w-max">
            {[
              { icon: Star, label: "Avis", desc: `${stats.pending} en attente`, href: "/reviews", color: "bg-yellow-500" },
              { icon: Building2, label: "Business", desc: `${stats.businesses} actif${stats.businesses > 1 ? "s" : ""}`, href: "/businesses", color: "bg-violet-500" },
              { icon: Sparkles, label: "IA", desc: "Paramètres", href: "/ai-settings", color: "bg-primary" },
              { icon: TrendingUp, label: "SEO", desc: "Auto-post", href: "/seo-autopost", color: "bg-green-500" },
            ].map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="bg-card rounded-2xl p-4 border border-border hover:border-primary/30 hover:shadow-md transition-all min-w-[140px]"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-semibold text-foreground text-sm">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Reviews - Priority to Pending */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground text-sm">À traiter en priorité</h2>
            </div>
            <Link to="/reviews">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                Voir tout
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {recentReviews.length > 0 ? (
            <div className="divide-y divide-border">
              {recentReviews.map((review) => (
                <div key={review.id} className={`p-4 transition-colors ${
                  !review.ai_response ? "bg-orange-500/5" : "hover:bg-muted/30"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                      !review.ai_response 
                        ? "bg-orange-500/20 text-orange-600" 
                        : "bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground"
                    }`}>
                      {review.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                        {review.ai_response ? (
                          <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Répondu
                          </span>
                        ) : (
                          <span className="text-[10px] bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-2.5 h-2.5" />
                            À répondre
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {review.comment || "Aucun commentaire"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p className="text-sm text-muted-foreground">Aucun avis en attente</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 rounded-xl"
                onClick={() => { syncBusinesses(); syncReviews(); }}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Synchroniser
              </Button>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
      
      {/* GMB Connection Dialog for email users */}
      <ConnectGMBDialog open={showGMBDialog} onOpenChange={setShowGMBDialog} />
    </div>
  );
};

export default Dashboard;
