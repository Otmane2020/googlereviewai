import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, Link, useSearchParams } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import { useSyncGoogleReviews } from "@/hooks/useSyncGoogleReviews";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ConnectGMBDialog } from "@/components/ConnectGMBDialog";
import { SyncProgressOverlay } from "@/components/SyncProgressOverlay";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { ReconnectGoogleDialog } from "@/components/ReconnectGoogleDialog";
import { LowCreditsBanner } from "@/components/LowCreditsBanner";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { UTMBuilderDialog } from "@/components/UTMBuilderDialog";
import { GmbInsightsCard } from "@/components/GmbInsightsCard";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// LinkedIn Insight Tag tracking for dashboard
declare global {
  interface Window {
    lintrk?: (action: string, data: object) => void;
  }
}

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Building2, TrendingUp, ChevronRight, RefreshCw, Loader2, MessageSquare, AlertCircle, CheckCircle2, Clock, ArrowUpRight, Percent, Link2, Smartphone, Sparkles, Pencil } from "lucide-react";
import { BrandSparkle } from "@/components/BrandSparkle";
import plaqueFront from "@/assets/nfc-plaque-front.jpg";

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
  location_id: string;
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
  const { t, i18n } = useTranslation();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleOAuthCallback } = useGoogleOAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showFreeUpgrade, setShowFreeUpgrade] = useState(false);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, aiResponses: 0, pending: 0, businesses: 0, responseRate: 0 });
  const [primaryBusinessName, setPrimaryBusinessName] = useState<string | null>(null);
  const [allBusinesses, setAllBusinesses] = useState<{ id: string; name: string; google_place_id: string | null; profile_image_url: string | null; maps_url: string | null; address: string | null; rating: number | null; total_reviews: number | null; last_reviews_sync_status: string | null; last_reviews_sync_error: string | null; last_reviews_sync_at: string | null; last_google_reviews_total: number | null }[]>([]);
  const [locationSyncError, setLocationSyncError] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [aeoStats, setAeoStats] = useState({ planned: 0, ready: 0, published: 0, nextDate: null as string | null });
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
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);

  // LinkedIn Insight Tag - track dashboard view
  useEffect(() => {
    if (window.lintrk) {
      window.lintrk('track', { conversion_id: 21122002 });
    }
  }, []);

  // Track user visits in localStorage (no cookies required)
  useEffect(() => {
    if (!user) return;
    
    const storageKey = `googlereviewai.com_visits_${user.id}`;
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
          toast.error("Erreur lors de la connexion à Google");
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
        .select("id, location_id, author, rating, comment, review_date, ai_response, google_reply, published_to_google")
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
      supabase.from("businesses").select("id, name, google_place_id, profile_image_url, maps_url, address, total_reviews, rating, is_active, last_reviews_sync_status, last_reviews_sync_error, last_reviews_sync_at, last_google_reviews_total", { count: "exact" }).eq("user_id", user.id),
      supabase.from("ai_settings").select("last_sync_at, last_sync_status, last_sync_error, reviews_synced_count").eq("user_id", user.id).maybeSingle()
    ]);
    
    if (syncStatusRes.data) setSyncStatus(syncStatusRes.data);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    
    // The dashboard displays the same active establishment as /reviews.
    // Never mix replies from inactive/other Google locations with the
    // selected location's totals (which caused impossible rates > 100%).
    const savedLocations = businessesRes.data || [];
    const managed = savedLocations.filter(b => b.is_active);
    const savedId = localStorage.getItem(`googlereviewai.com_selected_business_${user.id}`);
    const target = managed.find(b => b.id === savedId) || managed[0] || null;
    if (target?.id && savedId !== target.id) {
      localStorage.setItem(`googlereviewai.com_selected_business_${user.id}`, target.id);
    }
    setSelectedBusinessId(target?.id || null);
    setPrimaryBusinessName(target?.name || null);
    setAllBusinesses(managed.map(b => ({ id: b.id, name: b.name, google_place_id: b.google_place_id, profile_image_url: b.profile_image_url, maps_url: b.maps_url, address: b.address, rating: b.rating, total_reviews: b.total_reviews, last_reviews_sync_status: b.last_reviews_sync_status, last_reviews_sync_error: b.last_reviews_sync_error, last_reviews_sync_at: b.last_reviews_sync_at, last_google_reviews_total: b.last_google_reviews_total })));

    const scopedReviews = target?.google_place_id
      ? allReviews.filter(r => r.location_id === target.google_place_id)
      : [];
    const hasGoogleReply = (r: Review) => Boolean(r.google_reply && r.google_reply.trim());
    const isAnswered = (r: Review) => Boolean(r.published_to_google || hasGoogleReply(r));
    const sortedReviews = [...scopedReviews].sort((a, b) => {
      const aPending = !isAnswered(a);
      const bPending = !isAnswered(b);
      if (aPending !== bPending) return aPending ? -1 : 1;
      return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
    });
    setRecentReviews(sortedReviews.slice(0, 5));

    const localTotal = scopedReviews.length;
    const googleTotal = target?.total_reviews || 0;
    const displayTotal = Math.max(localTotal, googleTotal);
    const localAverage = localTotal
      ? scopedReviews.reduce((sum, r) => sum + r.rating, 0) / localTotal : 0;
    const displayAverage = target?.rating && target.rating > 0 ? target.rating : localAverage;
    const responded = scopedReviews.filter(isAnswered).length;
    const pending = scopedReviews.filter(r => !isAnswered(r)).length;
    const aiReady = scopedReviews.filter(r => r.ai_response && !isAnswered(r)).length;
    const responseRate = displayTotal ? Math.min(100, Math.round(100 * responded / displayTotal)) : 0;

    setStats({
      total: displayTotal,
      avgRating: Number(displayAverage.toFixed(1)),
      aiResponses: aiReady,
      pending,
      businesses: managed.length,
      responseRate,
    });

    // Fetch AEO autoposting stats (Q&A scheduled content)
    const { data: aeoData } = await supabase
      .from("scheduled_content")
      .select("status, scheduled_date")
      .eq("user_id", user.id)
      .eq("content_type", "aeo_qa")
      .eq("business_id", target?.id || "00000000-0000-0000-0000-000000000000");
    
    if (aeoData) {
      const planned = aeoData.length;
      const ready = aeoData.filter((i: any) => i.status === "generated").length;
      const published = aeoData.filter((i: any) => i.status === "published").length;
      const upcoming = aeoData
        .filter((i: any) => i.status !== "published" && new Date(i.scheduled_date) >= new Date(new Date().toDateString()))
        .sort((a: any, b: any) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
      setAeoStats({ planned, ready, published, nextDate: upcoming?.scheduled_date || null });
    }

    setLoading(false);
  }, [user]);


  const switchDashboardLocation = async (businessId: string) => {
    if (!user) return;
    localStorage.setItem(`googlereviewai.com_selected_business_${user.id}`, businessId);
    setSelectedBusinessId(businessId);
    setLocationSyncError(null);
    await fetchData();
    const next = allBusinesses.find(b => b.id === businessId);
    if (!next?.google_place_id) {
      setLocationSyncError(i18n.language?.startsWith("fr")
        ? "Cette fiche n'a pas de lien Google Business vérifié. Associez-la dans Paramètres."
        : "This location has no verified Google Business link. Connect it in Settings.");
      return;
    }
    // Fetch only the selected location, not every Google account/business.
    const response = await syncReviews(businessId);
    if (!response?.success || response.errors?.length) {
      setLocationSyncError(response?.errors?.join(" · ") || response?.message ||
        (i18n.language?.startsWith("fr") ? "Impossible de synchroniser cette fiche." : "Unable to sync this location."));
    } else {
      setLocationSyncError(null);
    }
    await fetchData();
  };

  // Show the upgrade once after the free quota is exhausted, including
  // automatically generated replies. Do not interrupt every dashboard visit.
  useEffect(() => {
    if (!user || !profile) return;
    const free = !profile.plan_name || profile.plan_name.trim().toLowerCase() === "free";
    const key = `googlereviewai.com_free_upgrade_shown_${user.id}`;
    if (free && profile.credits === 0 && !localStorage.getItem(key)) {
      setShowFreeUpgrade(true);
      localStorage.setItem(key, "1");
    }
  }, [user, profile]);

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
        const hasInitialSynced = localStorage.getItem(`googlereviewai.com_initial_sync_${user.id}`);
        
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
          localStorage.setItem(`googlereviewai.com_initial_sync_${user.id}`, "true");
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
      localStorage.setItem(`googlereviewai.com_initial_sync_${user.id}`, "true");
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
    <>
      <Helmet>
        <title>Dashboard | Reviews AI</title>
        <meta name="description" content="Your Reviews AI dashboard: AI review responses, GEO ranking and local SEO performance at a glance." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://reviewsai.store/dashboard" />
      </Helmet>
      <div className="bg-background">
        {/* Mobile-only header (desktop uses sidebar layout) */}


        <main className="max-w-7xl mx-auto px-3.5 sm:px-5 md:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-5">
          {/* Compact active Google Business identity, no oversized hero card. */}
          {allBusinesses.length > 0 ? (
            <section className="reviewai-surface px-3.5 py-3.5 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="relative shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-primary/10 border border-border/60 overflow-hidden flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-primary/35" aria-hidden="true" />
                  {allBusinesses.find(b => b.id === selectedBusinessId)?.profile_image_url && (
                    <img key={selectedBusinessId || "business-cover"}
                      src={allBusinesses.find(b => b.id === selectedBusinessId)!.profile_image_url!}
                      alt={primaryBusinessName || "Google Business"}
                      className="absolute inset-0 h-full w-full object-cover" loading="eager"
                      referrerPolicy="no-referrer"
                      onError={event => { event.currentTarget.style.display = "none"; }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold tracking-wide uppercase text-primary leading-tight">
                    Google Business <span className="text-emerald-600">· {i18n.language?.startsWith("fr") ? "Fiche active" : "Active"}</span>
                  </p>
                  <Select value={selectedBusinessId || allBusinesses[0].id}
                    onValueChange={v => { void switchDashboardLocation(v); }}>
                    <SelectTrigger
                      title={allBusinesses.find(b => b.id === selectedBusinessId)?.name || allBusinesses[0].name}
                      aria-label={i18n.language?.startsWith("fr") ? "Changer l'établissement" : "Choose business"}
                      className="w-full min-w-0 h-auto border-0 px-0 py-1 bg-transparent shadow-none focus:ring-0 gap-1 items-start text-sm sm:text-base font-bold text-foreground leading-snug [&>span]:!line-clamp-none [&>span]:!whitespace-normal [&>span]:!break-words [&>span]:!text-left [&>svg]:shrink-0 [&>svg]:mt-1">
                      <SelectValue placeholder={i18n.language?.startsWith("fr") ? "Choisir un établissement" : "Select location"} />
                    </SelectTrigger>
                    <SelectContent className="max-w-[92vw]">
                      {allBusinesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {allBusinesses.find(b => b.id === selectedBusinessId)?.rating
                      ? <><Star className="h-3 w-3 inline mr-0.5 text-amber-500 fill-amber-500" />
                        {Number(allBusinesses.find(b => b.id === selectedBusinessId)?.rating).toFixed(1)} · </>
                      : null}
                    {t("dashboardPage.reviewsInApp", { count: stats.total })}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-center justify-center gap-1">
                  <a href={allBusinesses.find(b => b.id === selectedBusinessId)?.maps_url || "/settings#managed-locations"}
                    target={allBusinesses.find(b => b.id === selectedBusinessId)?.maps_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-primary"
                    title={i18n.language?.startsWith("fr") ? "Ouvrir la fiche sur Google" : "Open Google listing"}
                    aria-label={i18n.language?.startsWith("fr") ? "Ouvrir la fiche sur Google" : "Open Google listing"}>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
                    onClick={() => { if (selectedBusinessId) void switchDashboardLocation(selectedBusinessId); }}
                    disabled={isSyncingReviews}
                    title={i18n.language?.startsWith("fr") ? "Synchroniser les avis" : "Sync reviews"}
                    aria-label={i18n.language?.startsWith("fr") ? "Synchroniser les avis" : "Sync reviews"}>
                    {isSyncingReviews ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {i18n.language?.startsWith("fr") ? "Aucune fiche active — sélectionnez-en une dans Paramètres." : "No active location — select one in Settings."}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => navigate("/settings#managed-locations")}>
                {i18n.language?.startsWith("fr") ? "Configurer" : "Configure"}
              </Button>
            </section>
          )}
        {/* Trial Banner */}
        {profile?.subscription_status === "trial" && (
          <div className="reviewai-soft-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BrandSparkle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{t("dashboardPage.trial")}</p>
                <p className="text-xs text-muted-foreground">{t("dashboardPage.trialDesc")}</p>
              </div>
              <Link to="/settings">
                <Button size="sm" variant="outline" className="rounded-xl text-xs">
                  {t("dashboardPage.upgrade")}
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
                  {t("dashboardPage.connectGoogleTitle")}
                </h3>
                <p className="text-accent-foreground/80 text-sm mb-3">
                  {t("dashboardPage.connectGoogleDescription")}
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
                  {t("dashboardPage.connectGoogleButton")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Low Credits Banner - show when credits are 0 */}
        <LowCreditsBanner credits={profile?.credits || 0} pendingReviews={stats.pending} currentPlan={profile?.plan_name} />

        {/* Sync Status Card - Only show on errors */}
        {syncStatus && syncStatus.last_sync_status === "error" && (
          <div className="rounded-xl p-3 border bg-destructive/10 border-destructive/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {t("dashboardPage.syncErrorTitle")}
                  </p>
                  {syncStatus.last_sync_at && (
                    <p className="text-[10px] text-muted-foreground">
                      {t("dashboardPage.lastSyncLabel")} {(() => {
                        const diff = Date.now() - new Date(syncStatus.last_sync_at).getTime();
                        const secs = Math.floor(diff / 1000);
                        if (secs < 60) return t("dashboardPage.syncJustNow");
                        const mins = Math.floor(secs / 60);
                        if (mins < 60) return t("dashboardPage.syncMinutesAgo", { count: mins });
                        const hours = Math.floor(mins / 60);
                        if (hours < 24) return t("dashboardPage.syncHoursAgo", { count: hours });
                        return t("dashboardPage.syncDaysAgo", { count: Math.floor(hours / 24) });
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
                  onClick={() => setShowReconnectDialog(true)}
                >
                  {t("dashboardPage.reconnect")}
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

        {/* Clear actionable review status — soft, brand-consistent and semantic. */}
        <Link to="/reviews?status=pending" className="block group">
          <div className={`reviewai-surface relative overflow-hidden p-4 sm:p-5 transition-all group-hover:border-primary/25 group-hover:shadow-md ${
            urgencyLevel === "red"
              ? "border-red-200/70 dark:border-red-900/40"
              : urgencyLevel === "orange"
                ? "border-orange-200/70 dark:border-orange-900/40"
                : "border-emerald-200/70 dark:border-emerald-900/40"
          }`}>
            <div className={`absolute inset-y-0 left-0 w-1.5 ${
              urgencyLevel === "red" ? "bg-red-500" : urgencyLevel === "orange" ? "bg-orange-500" : "bg-emerald-500"
            }`} />
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl shrink-0 flex items-center justify-center ${
                urgencyLevel === "red" ? "bg-red-500/10 text-red-600"
                : urgencyLevel === "orange" ? "bg-orange-500/10 text-orange-600"
                : "bg-emerald-500/10 text-emerald-600"
              }`}>
                {urgencyLevel === "green" ? <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" /> : <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm sm:text-base">
                  {urgencyLevel === "green" ? t("dashboardPage.bannerAllClear") : t("dashboardPage.bannerUnanswered")}
                </p>
                <p className={`text-2xl sm:text-3xl font-extrabold tabular-nums leading-tight mt-1 ${
                  urgencyLevel === "green" ? "text-emerald-600" : urgencyLevel === "orange" ? "text-orange-600" : "text-red-600"
                }`}>{stats.pending}</p>
              </div>
              <div className="h-9 w-9 shrink-0 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </Link>

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Response Rate */}
          <Link to="/reviews" className={`rounded-2xl p-4 border transition-all hover:scale-[1.02] active:scale-[0.98] ${
            responseRateColor === "green" 
              ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10" 
              : responseRateColor === "orange"
              ? "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10"
              : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Percent className={`w-4 h-4 ${
                responseRateColor === "green" ? "text-green-500" 
                : responseRateColor === "orange" ? "text-orange-500" 
                : "text-red-500"
              }`} />
              <span className="text-xs text-muted-foreground">{t("dashboardPage.responseRate")}</span>
            </div>
            <div className={`text-2xl font-bold ${
              responseRateColor === "green" ? "text-green-600" 
              : responseRateColor === "orange" ? "text-orange-600" 
              : "text-red-600"
            }`}>
              {stats.responseRate}%
            </div>
          </Link>

          {/* Average Rating */}
          <Link to="/reviews" className="reviewai-surface p-4 sm:p-5 transition-all hover:border-primary/35 active:scale-[0.99]">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-muted-foreground">{t("dashboardPage.averageRating")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.avgRating || "-"}</div>
          </Link>

          {/* Total Reviews */}
          <Link to="/reviews" className="reviewai-surface p-4 sm:p-5 transition-all hover:border-primary/35 active:scale-[0.99]">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t("dashboardPage.totalReviews")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </Link>

          {/* AI Responses */}
          <Link to="/ai-settings" className="reviewai-surface p-4 sm:p-5 transition-all hover:border-primary/35 active:scale-[0.99]">
            <div className="flex items-center gap-2 mb-2">
              <BrandSparkle className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">{t("dashboardPage.aiResponses")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.aiResponses}</div>
          </Link>
        </div>

        {/* GMB Performance Stats */}
        {user && hasGoogleConnected && (
          <GmbInsightsCard userId={user.id} businessId={selectedBusinessId} />
        )}

        {/* GEO Autoposting Block - AI-generated Q&A scheduled to GMB */}
        <Link to="/geo-rank" className="block">
          <div className="relative overflow-hidden rounded-2xl p-5 reviewai-brand-gradient shadow-md shadow-primary/15 transition-all hover:shadow-xl">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <BrandSparkle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-base">{t("dashboardPage.geoAutoTitle")}</p>
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">AI</span>
                    </div>
                    <p className="text-white/70 text-xs">{t("dashboardPage.geoAutoDesc")}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-white/80" />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center">
                  <div className="text-xl font-bold text-white">{aeoStats.planned}</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">{t("dashboardPage.planned")}</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center">
                  <div className="text-xl font-bold text-white">{aeoStats.ready}</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">{t("dashboardPage.ready")}</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center">
                  <div className="text-xl font-bold text-white">{aeoStats.published}</div>
                  <div className="text-[10px] text-white/70 uppercase tracking-wide">{t("dashboardPage.published")}</div>
                </div>
              </div>

              {aeoStats.planned === 0 ? (
                <div className="bg-white/15 backdrop-blur rounded-xl p-3 flex items-center gap-2">
                  <BrandSparkle className="w-4 h-4 text-white shrink-0" />
                  <p className="text-xs text-white font-medium">{t("dashboardPage.generateFirstPlan")}</p>
                </div>
              ) : aeoStats.nextDate ? (
                <div className="bg-white/15 backdrop-blur rounded-xl p-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white shrink-0" />
                  <p className="text-xs text-white">
                    {t("dashboardPage.nextPost")} <span className="font-semibold">{new Date(aeoStats.nextDate).toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric" })}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-white/15 backdrop-blur rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <p className="text-xs text-white font-medium">{t("dashboardPage.allPublished")}</p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Quick Actions - Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3 min-w-max">
            {[
              { icon: Star, label: t("dashboardPage.actionReviews"), desc: t("dashboardPage.actionPending", { count: stats.pending }), href: "/reviews", color: "bg-yellow-500" },
              { icon: Building2, label: t("dashboardPage.actionLocations"), desc: t("dashboardPage.actionLocationsActive", { count: stats.businesses, plural: stats.businesses > 1 ? "s" : "" }), href: "/businesses", color: "bg-violet-500" },
              { icon: BrandSparkle, label: t("dashboardPage.actionAi"), desc: t("dashboardPage.actionAiDesc"), href: "/ai-settings", color: "bg-primary" },
              { icon: TrendingUp, label: t("dashboardPage.actionSeo"), desc: t("dashboardPage.actionSeoDesc"), href: "/seo-autopost", color: "bg-green-500" },
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

        {/* Cross-sell : Plaque NFC + QR Google Avis */}
        <Link
          to="/boutique/nfc"
          className="group relative block overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4 p-4">
            <div className="w-20 h-20 rounded-xl bg-white border border-emerald-100 overflow-hidden flex-shrink-0 shadow-xs">
              <img src={plaqueFront} alt="Plaque NFC + QR Google Avis" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" /> {t("dashboardPage.shopNew")}
                </span>
                <span className="text-xs text-muted-foreground">{t("dashboardPage.shopName")}</span>
              </div>
              <div className="font-semibold text-foreground text-sm leading-tight">
                {t("dashboardPage.shopProduct")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t("dashboardPage.shopDescription")}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-lg font-bold text-emerald-600">19,99 €</span>
              <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Recent Reviews - Priority to Pending */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground text-sm">{t("dashboardPage.priorityQueue")}</h2>
            </div>
            <Link to="/reviews">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                {t("dashboardPage.viewAll")}
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
                            {review.google_reply ? t("dashboardPage.reviewReplied") : t("dashboardPage.reviewAiReady")}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {t("dashboardPage.reviewToAnswer")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {review.comment || "No comment"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p className="text-sm text-muted-foreground">{t("dashboardPage.noPending")}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 rounded-xl"
                onClick={async () => { 
                  setShowSyncProgress(true);
                  setSyncStep("businesses");
                  await syncBusinesses(); 
                  setSyncStep("reviews");
                  const syncResult = await syncReviews();
                  setSyncStep("complete");
                  fetchData();
                  if (syncResult?.requires_reconnect) {
                    setShowSyncProgress(false);
                    setShowReconnectDialog(true);
                  }
                }}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {t("dashboardPage.syncErrorTitle")}
              </Button>
            </div>
          )}
        </div>
          </main>


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

          {/* Free quota conversion prompt, shown only once per account */}
          <UpgradeDialog
            open={showFreeUpgrade}
            onOpenChange={setShowFreeUpgrade}
            currentPlan={profile?.plan_name}
            exhausted
          />

          {/* Google Reconnect Dialog */}
          <ReconnectGoogleDialog
            open={showReconnectDialog}
            onOpenChange={setShowReconnectDialog}
          />
      </div>
    </>
  );
};

export default Dashboard;