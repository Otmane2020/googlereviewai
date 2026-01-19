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
  Zap,
  ArrowUpRight
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
  const [stats, setStats] = useState({ total: 0, avgRating: 0, aiResponses: 0, pending: 0, businesses: 0 });
  const [loading, setLoading] = useState(true);
  const [showGMBDialog, setShowGMBDialog] = useState(false);
  const { syncBusinesses, isSyncing: isSyncingBusinesses } = useSyncGoogleBusinesses();
  const { syncReviews, isSyncing: isSyncingReviews } = useSyncGoogleReviews();
  const hasSyncedRef = useRef(false);
  const hasCheckedGMBRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [profileRes, reviewsRes, businessesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("reviews").select("id, author, rating, comment, review_date, ai_response").eq("user_id", user.id).order("review_date", { ascending: false }),
      supabase.from("businesses").select("id", { count: "exact" }).eq("user_id", user.id).eq("is_active", true)
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    
    const reviews = reviewsRes.data || [];
    setRecentReviews(reviews.slice(0, 5));
    
    const total = reviews.length;
    const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const aiResponses = reviews.filter(r => r.ai_response).length;
    const pending = reviews.filter(r => !r.ai_response).length;
    
    setStats({
      total,
      avgRating: Number(avgRating.toFixed(1)),
      aiResponses,
      pending,
      businesses: businessesRes.count || 0
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome + Credits Banner */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-foreground/80 text-sm">Bienvenue,</p>
              <h1 className="text-2xl font-bold">{profile?.full_name?.split(" ")[0] || "👋"}</h1>
              {profile?.subscription_status === "trial" && (
                <p className="text-sm text-primary-foreground/70 mt-1">Essai gratuit actif</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold">{profile?.credits || 0}</div>
                <div className="text-xs text-primary-foreground/80">Crédits</div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                onClick={() => { syncBusinesses(); syncReviews().then(() => fetchData()); }}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2">Sync</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.avgRating || "-"}</div>
                <div className="text-xs text-muted-foreground">Note moyenne</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total avis</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.aiResponses}</div>
                <div className="text-xs text-muted-foreground">Réponses IA</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">En attente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Star, label: "Avis", desc: "Gérer les avis", href: "/reviews", color: "text-accent" },
            { icon: Building2, label: "Business", desc: `${stats.businesses} établissement${stats.businesses > 1 ? "s" : ""}`, href: "/businesses", color: "text-violet-500" },
            { icon: Sparkles, label: "IA", desc: "Paramètres", href: "/ai-settings", color: "text-primary" },
            { icon: TrendingUp, label: "SEO", desc: "Auto-post", href: "/seo-autopost", color: "text-secondary" },
          ].map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <action.icon className={`w-5 h-5 ${action.color}`} />
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-3">
                <div className="font-semibold text-foreground">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Reviews */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Avis récents</h2>
            <Link to="/reviews">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Voir tout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {recentReviews.length > 0 ? (
            <div className="divide-y divide-border">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-sm font-semibold text-foreground flex-shrink-0">
                      {review.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-accent fill-accent" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                        {review.ai_response ? (
                          <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-medium">IA</span>
                        ) : (
                          <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full font-medium">New</span>
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
              <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
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