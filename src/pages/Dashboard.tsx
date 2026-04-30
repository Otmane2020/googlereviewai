import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import { useSyncGoogleReviews } from "@/hooks/useSyncGoogleReviews";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ConnectGMBDialog } from "@/components/ConnectGMBDialog";
import { SyncProgressOverlay } from "@/components/SyncProgressOverlay";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { LowCreditsBanner } from "@/components/LowCreditsBanner";
import { UTMBuilderDialog } from "@/components/UTMBuilderDialog";
import { GmbInsightsCard } from "@/components/GmbInsightsCard";
import { toast } from "sonner";

// LinkedIn Insight Tag tracking for dashboard
declare global {
  interface Window {
    lintrk?: (action: string, data: object) => void;
  }
}

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
  Percent,
  Link2
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
  google_reply: string | null;
  published_to_google: boolean | null;
}

interface SyncStatus {
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  reviews_synced_count: number | null;
}

const Dashboard = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleOAuthCallback } = useGoogleOAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, aiResponses: 0, pending: 0, businesses: 0, responseRate: 0 });
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGMBDialog, setShowGMBDialog] = useState(false);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncStep, setSyncStep] = useState<"businesses" | "reviews" | "complete">("businesses");
  const { syncBusinesses, isSyncing: isSyncingBusinesses } = useSyncGoogleBusinesses();
  const { syncReviews, isSyncing: isSyncingReviews } = useSyncGoogleReviews();
  const hasSyncedRef = useRef(false);
  const hasCheckedGMBRef = useRef(false);
  const hasHandledOAuthRef = useRef(false);
  
  // Business selection dialog state
  const [showSelectBusinessesDialog, setShowSelectBusinessesDialog] = useState(false);
  const [googleBusinessesForSelection, setGoogleBusinessesForSelection] = useState<any[]>([]);
  const [maxBusinessesLimit, setMaxBusinessesLimit] = useState(1);

  // LinkedIn Insight Tag - track dashboard view
  useEffect(() => {
    if (window.lintrk) {
      window.lintrk('track', { conversion_id: 21122002 });
    }
  }, []);

  // Track user visits in localStorage (no cookies required)
  useEffect(() => {
    if (!user) return;
    
    const storageKey = `starlinko_visits_${user.id}`;
    const now = new Date().toISOString();
    
    try {
      const existingData = localStorage.getItem(storageKey);
      const visitData = existingData ? JSON.parse(existingData) : {
        firstVisit: now,
        visitCount: 0,
        sessions: []
      };
      
      // Increment visit count
      visitData.visitCount += 1;
      visitData.lastVisit = now;
      
      // Keep last 50 sessions for analytics
      visitData.sessions.push({
        date: now,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent
      });
      if (visitData.sessions.length > 50) {
        visitData.sessions = visitData.sessions.slice(-50);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(visitData));
      console.log(`[Tracking] Visit #${visitData.visitCount} recorded`);
    } catch (e) {
      console.error('[Tracking] Failed to track visit:', e);
    }
  }, [user]);

  // Handle Google OAuth callback - when user returns from Google with a code
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state"); // Contains user_id
      
      if (code && user && !hasHandledOAuthRef.current) {
        hasHandledOAuthRef.current = true;
        console.log("[Dashboard] Handling Google OAuth callback with code");
        
        // Clear URL params immediately
        setSearchParams({});
        
        try {
          const success = await handleOAuthCallback(code);
          
          if (success) {
            toast.success("Google Business connecté avec succès !");
            // Trigger sync after successful connection
            setShowSyncProgress(true);
            setSyncStep("businesses");
            const businessResult = await syncBusinesses();
            
            if (businessResult?.requires_selection) {
              setShowSyncProgress(false);
              setGoogleBusinessesForSelection(businessResult.google_businesses || []);
              setMaxBusinessesLimit(businessResult.max_businesses || 1);
              setShowSelectBusinessesDialog(true);
            } else {
              setSyncStep("reviews");
              await syncReviews();
              setSyncStep("complete");
              // Refresh data after sync - will be triggered by next effect
              setLoading(false);
            }
          } else {
            toast.error("Échec de la connexion Google. Veuillez réessayer.");
          }
        } catch (error) {
          console.error("[Dashboard] OAuth callback error:", error);
          toast.error("Erreur lors de la connexion Google");
        }
      }
    };
    
    handleGoogleCallback();
  }, [searchParams, user, handleOAuthCallback, setSearchParams, syncBusinesses, syncReviews]);

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
        .select("id, author, rating, comment, review_date, ai_response, google_reply, published_to_google")
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

    const [profileRes, businessesRes, syncStatusRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("businesses").select("id, total_reviews, rating", { count: "exact" }).eq("user_id", user.id).eq("is_active", true),
      supabase.from("ai_settings").select("last_sync_at, last_sync_status, last_sync_error, reviews_synced_count").eq("user_id", user.id).maybeSingle()
    ]);
    
    if (syncStatusRes.data) setSyncStatus(syncStatusRes.data);

    if (profileRes.data) setProfile(profileRes.data);
    
    // Helper to check if review has a real google reply
    const hasReply = (r: Review) => r.google_reply && r.google_reply.trim() !== '';
    
    // Sort by pending first (no Google reply = not answered on Google), then by date
    const sortedReviews = allReviews.sort((a, b) => {
      // Pending reviews first (no Google reply = unanswered on Google)
      const aPending = !a.published_to_google && !hasReply(a);
      const bPending = !b.published_to_google && !hasReply(b);
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      // Then by date
      return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
    });
    
    setRecentReviews(sortedReviews.slice(0, 5));
    
    const total = allReviews.length;
    const avgRating = total > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    
    // Use Google's official total from businesses table if available (sum of all active businesses)
    const businessesList = businessesRes.data || [];
    const googleTotal = businessesList.reduce((sum: number, b: { total_reviews?: number | null }) => sum + (b.total_reviews || 0), 0);
    const googleAvgRating = businessesList.reduce((sum: number, b: { rating?: number | null }) => sum + (b.rating || 0), 0) / (businessesList.length || 1);
    
    // Use Google's count if available and greater than 0, otherwise fall back to local count
    const displayTotal = googleTotal > 0 ? googleTotal : total;
    const displayAvgRating = googleTotal > 0 ? googleAvgRating : avgRating;
    
    // Standardized counts (same logic as Reviews page):
    // - pending = no published_to_google AND no google_reply (truly unanswered)
    // - aiReady = has AI response but not published and no google_reply (ready to publish)
    // - responded = published_to_google OR has google_reply (answered)
    const hasGoogleReply = (r: Review) => r.google_reply && r.google_reply.trim() !== '';
    const pending = allReviews.filter(r => !r.published_to_google && !hasGoogleReply(r)).length;
    const aiReady = allReviews.filter(r => r.ai_response && !r.published_to_google && !hasGoogleReply(r)).length;
    const responded = allReviews.filter(r => r.published_to_google || hasGoogleReply(r)).length;
    const responseRate = displayTotal > 0 ? Math.round((responded / displayTotal) * 100) : 0;
    
    setStats({
      total: displayTotal,
      avgRating: Number(displayAvgRating.toFixed(1)),
      aiResponses: aiReady,
      pending,
      businesses: businessesRes.count || 0,
      responseRate
    });

    setLoading(false);
  }, [user]);

  // Use subscription verification hook
  const { loading: subscriptionLoading } = useRequireSubscription();

  // Check for pending business selection from Auth flow (immediate popup)
  useEffect(() => {
    const pendingSelection = sessionStorage.getItem("pending_business_selection");
    if (pendingSelection && user) {
      try {
        const { businesses, maxBusinesses } = JSON.parse(pendingSelection);
        setGoogleBusinessesForSelection(businesses);
        setMaxBusinessesLimit(maxBusinesses);
        setShowSelectBusinessesDialog(true);
        sessionStorage.removeItem("pending_business_selection");
        console.log("[Dashboard] Showing immediate business selection from Auth flow");
      } catch (e) {
        console.error("[Dashboard] Failed to parse pending selection:", e);
        sessionStorage.removeItem("pending_business_selection");
      }
    }
  }, [user]);

  // Fetch data when subscription is verified
  useEffect(() => {
    if (!subscriptionLoading && user) {
      fetchData();
    }
  }, [subscriptionLoading, user, fetchData]);

  // Auto-sync on first login only (silent after first time)
  // Skip if selection dialog is already shown from Auth flow
  useEffect(() => {
    const autoSync = async () => {
      // Skip if already showing selection from Auth flow
      if (showSelectBusinessesDialog) {
        console.log("[Dashboard] Skipping auto-sync, selection dialog already shown");
        return;
      }
      
      if (!loading && user && session?.provider_token && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        
        // Check if this is the first sync ever for this user
        const hasInitialSynced = localStorage.getItem(`starlinko_initial_sync_${user.id}`);
        
        if (!hasInitialSynced) {
          // First time: show animation (only if not already synced from Auth)
          setShowSyncProgress(true);
          setSyncStep("businesses");
          const businessResult = await syncBusinesses();
          
          // Check if user needs to select businesses (has more than plan allows)
          if (businessResult?.requires_selection) {
            setShowSyncProgress(false);
            setGoogleBusinessesForSelection(businessResult.google_businesses || []);
            setMaxBusinessesLimit(businessResult.max_businesses || 1);
            setShowSelectBusinessesDialog(true);
            // Keep hasSyncedRef true to prevent loop - selection will handle the rest
            return;
          }
          
          setSyncStep("reviews");
          await syncReviews();
          setSyncStep("complete");
          localStorage.setItem(`starlinko_initial_sync_${user.id}`, "true");
        } else {
          // Silent sync in background
          const businessResult = await syncBusinesses();
          
          // Check if user needs to select businesses
          if (businessResult?.requires_selection) {
            setGoogleBusinessesForSelection(businessResult.google_businesses || []);
            setMaxBusinessesLimit(businessResult.max_businesses || 1);
            setShowSelectBusinessesDialog(true);
            return;
          }
          
          await syncReviews();
        }
        fetchData();
      }
    };
    autoSync();
  }, [loading, user, session, syncBusinesses, syncReviews, fetchData, showSelectBusinessesDialog]);
  
  // Handle successful business selection
  const handleBusinessSelectionSuccess = async () => {
    // Now sync reviews for the selected businesses
    setShowSyncProgress(true);
    setSyncStep("reviews");
    await syncReviews();
    setSyncStep("complete");
    
    // Mark initial sync as complete
    if (user) {
      localStorage.setItem(`starlinko_initial_sync_${user.id}`, "true");
    }
    
    fetchData();
  };

  // Check if user has Google connected (has refresh token stored)
  const [hasGoogleConnected, setHasGoogleConnected] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("google_refresh_token")
        .eq("id", user.id)
        .maybeSingle();
      
      setHasGoogleConnected(!!profile?.google_refresh_token);
    };
    
    checkGoogleConnection();
  }, [user]);

  // Check if user signed up with email (no Google provider) and show GMB dialog
  // Now ALWAYS show if no Google connected (payment first flow)
  useEffect(() => {
    if (!loading && user && !hasCheckedGMBRef.current && hasGoogleConnected === false) {
      hasCheckedGMBRef.current = true;
      const hasSeenGMBPrompt = localStorage.getItem(`gmb_prompt_${user.id}`);
      
      if (!hasSeenGMBPrompt) {
        // Delay dialog to let page load
        setTimeout(() => {
          setShowGMBDialog(true);
          localStorage.setItem(`gmb_prompt_${user.id}`, "true");
        }, 1500);
      }
    }
  }, [loading, user, hasGoogleConnected]);

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
    <DashboardLayout title="Overview">
      <div className="bg-gradient-to-b from-background to-muted/20">
        {/* Mobile-only header (desktop uses sidebar layout) */}
        <div className="md:hidden">
          <DashboardHeader />
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{profile?.full_name?.split(" ")[0] || "👋"}</h1>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <div className="text-center px-4 py-2 bg-primary/10 rounded-xl">
                <div className="text-lg font-bold text-primary">{profile?.credits || 0}</div>
                <div className="text-[10px] text-muted-foreground">Credits</div>
              </div>
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-xl h-12 w-12"
              onClick={async () => { 
                setShowSyncProgress(true);
                setSyncStep("businesses");
                await syncBusinesses(); 
                setSyncStep("reviews");
                await syncReviews();
                setSyncStep("complete");
                fetchData();
              }}
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

        {/* Connect Google Banner - PAYMENT FIRST: Show prominently when user has paid but not connected Google */}
        {hasGoogleConnected === false && stats.businesses === 0 && (
          <div className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-5 border border-accent/30 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="white"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="white"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="white"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="white"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-accent-foreground text-lg mb-1">
                  🎉 Dernière étape : Connectez Google
                </h3>
                <p className="text-accent-foreground/80 text-sm mb-3">
                  Liez votre compte Google pour synchroniser vos avis et commencer à utiliser l'IA.
                </p>
                <Button 
                  onClick={() => setShowGMBDialog(true)}
                  className="bg-white text-accent hover:bg-white/90 font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Connecter Google Business
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Low Credits Banner - show when credits are 0 */}
        <LowCreditsBanner credits={profile?.credits || 0} pendingReviews={stats.pending} />

        {/* Sync Status Card - Only show on errors */}
        {syncStatus && syncStatus.last_sync_status === "error" && (
          <div className="rounded-xl p-3 border bg-destructive/10 border-destructive/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Erreur de synchronisation
                  </p>
                  {syncStatus.last_sync_at && (
                    <p className="text-[10px] text-muted-foreground">
                      Dernière sync: {(() => {
                        const diff = Date.now() - new Date(syncStatus.last_sync_at).getTime();
                        const secs = Math.floor(diff / 1000);
                        if (secs < 60) return "à l'instant";
                        const mins = Math.floor(secs / 60);
                        if (mins < 60) return `il y a ${mins} min`;
                        const hours = Math.floor(mins / 60);
                        if (hours < 24) return `il y a ${hours}h`;
                        return `il y a ${Math.floor(hours / 24)}j`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
              {syncStatus.last_sync_error && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-destructive h-7"
                  onClick={() => navigate("/settings")}
                >
                  Reconnecter
                </Button>
              )}
            </div>
            {syncStatus.last_sync_error && (
              <p className="text-[10px] text-destructive mt-1 line-clamp-1">
                {syncStatus.last_sync_error}
              </p>
            )}
          </div>
        )}

        {/* Urgency Card - Non répondu */}
        <Link to="/reviews?status=pending" className="block">
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

        {/* GMB Performance Stats */}
        {user && hasGoogleConnected && (
          <GmbInsightsCard userId={user.id} />
        )}

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
                      !review.ai_response && !review.google_reply
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
                        {review.ai_response || review.google_reply ? (
                          <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {review.google_reply ? "Répondu" : "IA prête"}
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
                onClick={async () => { 
                  setShowSyncProgress(true);
                  setSyncStep("businesses");
                  await syncBusinesses(); 
                  setSyncStep("reviews");
                  await syncReviews();
                  setSyncStep("complete");
                  fetchData();
                }}
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
      
      {/* Sync Progress Overlay */}
      <SyncProgressOverlay 
        isVisible={showSyncProgress} 
        currentStep={syncStep}
        onComplete={() => setShowSyncProgress(false)}
      />
      
      {/* Business Selection Dialog */}
      {user && (
        <SelectBusinessesDialog
          open={showSelectBusinessesDialog}
          onOpenChange={setShowSelectBusinessesDialog}
          businesses={googleBusinessesForSelection}
          maxBusinesses={maxBusinessesLimit}
          userId={user.id}
          onSuccess={handleBusinessSelectionSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
