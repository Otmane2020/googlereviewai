import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { ResponsePreviewDialog } from "@/components/ResponsePreviewDialog";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { Star, Search, Loader2, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Send, Copy, CheckCircle, Clock, MessageSquare, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSyncGoogleReviews } from "@/hooks/useSyncGoogleReviews";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrandSparkle } from "@/components/BrandSparkle";

interface ReviewCriteria {
  rooms?: number;
  service?: number;
  location?: number;
  cleanliness?: number;
  food?: number;
  [key: string]: number | undefined;
}

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
  google_reply: string | null;
  published_to_google: boolean | null;
  needs_new_response?: boolean | null;
  last_edited_at?: string | null;
  edit_count?: number | null;
  photos?: unknown; // JSON from DB
  criteria?: unknown; // JSON from DB
}

// Helper to safely parse photos array
const parsePhotos = (photos: unknown): string[] => {
  if (Array.isArray(photos)) {
    return photos.filter((p): p is string => typeof p === "string");
  }
  return [];
};

// Helper to safely parse criteria object
const parseCriteria = (criteria: unknown): ReviewCriteria | null => {
  if (criteria && typeof criteria === "object" && !Array.isArray(criteria)) {
    return criteria as ReviewCriteria;
  }
  return null;
};

interface Business {
  id: string;
  name: string;
  google_place_id: string | null;
  total_reviews: number | null;
  rating: number | null;
}

const REVIEWS_PER_PAGE = 10;

const Reviews = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>(() => {
    // Initialize from URL params if present
    const statusParam = new URLSearchParams(window.location.search).get("status");
    return statusParam || "all";
  });
  // Filter by specific review_id from URL (from notifications)
  const [filterReviewId, setFilterReviewId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("review_id");
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const { syncReviews, isSyncing, lastSyncResult } = useSyncGoogleReviews();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewReview, setPreviewReview] = useState<Review | null>(null);
  
  // Business selection dialog states
  const [showSelectBusinessesDialog, setShowSelectBusinessesDialog] = useState(false);
  const [googleBusinessesForSelection, setGoogleBusinessesForSelection] = useState<any[]>([]);
  const [maxBusinessesLimit, setMaxBusinessesLimit] = useState(1);
  const { syncBusinesses, isSyncing: isSyncingBusinesses } = useSyncGoogleBusinesses();

  // Sync URL params with state
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const reviewIdParam = searchParams.get("review_id");
    
    if (statusParam) {
      setFilterStatus(statusParam);
    }
    if (reviewIdParam) {
      setFilterReviewId(reviewIdParam);
      // Clear status filter when filtering by specific review
      setFilterStatus("all");
    }
  }, [searchParams]);

  // Load saved business selection from localStorage
  useEffect(() => {
    if (user) {
      const savedBusinessId = localStorage.getItem(`ranki.ai_selected_business_${user.id}`);
      if (savedBusinessId) {
        setSelectedBusinessId(savedBusinessId);
      }
    }
  }, [user]);

  // Save business selection to localStorage
  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId);
    if (user) {
      localStorage.setItem(`ranki.ai_selected_business_${user.id}`, businessId);
    }
    setCurrentPage(1);
  };

  const fetchData = useCallback(async (silent = true) => {
    if (!user) return;
    
    if (!silent) setLoading(true);
    
    const [businessesRes, reviewsRes, profileRes] = await Promise.all([
      supabase.from("businesses").select("id, name, google_place_id, total_reviews, rating").eq("user_id", user.id).eq("is_active", true),
      supabase.from("reviews").select("*").eq("user_id", user.id).order("review_date", { ascending: false }),
      supabase.from("profiles").select("credits, plan_name").eq("id", user.id).single()
    ]);

    const businessesList = businessesRes.data || [];
    setBusinesses(businessesList);
    setReviews(reviewsRes.data || []);
    setLastUpdate(new Date());
    
    // Update credits and plan
    if (profileRes.data) {
      setUserCredits(profileRes.data.credits || 0);
      setCurrentPlan(profileRes.data.plan_name || null);
    }
    
    // Auto-select first business if none selected or saved selection not found
    if (businessesList.length > 0) {
      const savedBusinessId = localStorage.getItem(`ranki.ai_selected_business_${user.id}`);
      if (savedBusinessId && businessesList.some(b => b.id === savedBusinessId)) {
        setSelectedBusinessId(savedBusinessId);
      } else {
        setSelectedBusinessId(businessesList[0].id);
        localStorage.setItem(`ranki.ai_selected_business_${user.id}`, businessesList[0].id);
      }
    }
    
    setLoading(false);
  }, [user]);

  // Use subscription verification hook
  const { loading: subscriptionLoading } = useRequireSubscription();

  // Initial fetch - only after subscription verified
  useEffect(() => {
    if (!subscriptionLoading && user) {
      fetchData(false);
    }
  }, [subscriptionLoading, user, fetchData]);

  // 🔴 REALTIME: Supabase subscription for live updates
  // IMPORTANT: Only depends on user and fetchData - NO re-subscription during operations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`reviews-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Always listen - DB is source of truth
          console.log("⚡ Realtime update:", payload.eventType);
          fetchData(true); // Silent refresh
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
        console.log("Realtime status:", status);
      });

    realtimeRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]); // Only user and fetchData - stable dependencies

  // 🔄 FALLBACK: Polling every 30s as backup (only when not doing operations)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Fallback can skip during operations (Realtime handles it anyway)
      if (!generatingId && !publishingId && !isSyncing) {
        fetchData(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchData, generatingId, publishingId, isSyncing]);

  const generateAIResponse = async (reviewId: number) => {
    if (!user) return;
    
    // Check credits before generating
    if (userCredits < 1) {
      setUpgradeDialogOpen(true);
      return;
    }
    
    setGeneratingId(reviewId);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-response", {
        body: { 
          reviewId, 
          userId: user.id,
          businessId: selectedBusinessId // Pass the selected business
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update local credits count
      setUserCredits(data.credits_remaining || 0);
      
      // Fetch the updated review to show in preview dialog
      const { data: updatedReview } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", reviewId)
        .single();
      
      if (updatedReview) {
        setPreviewReview(updatedReview);
        setPreviewDialogOpen(true);
      }
      
      toast({ title: t("reviewsPage.toastReady"), description: t("reviewsPage.toastReadyDesc", { n: data.credits_remaining }) });
    } catch (error) {
      toast({ title: t("reviewsPage.toastError"), description: error instanceof Error ? error.message : t("reviewsPage.toastGenFail"), variant: "destructive" });
    } finally {
      setGeneratingId(null);
    }
  };

  const publishToGoogle = async (reviewId: number) => {
    if (!user) return;
    setPublishingId(reviewId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let providerToken = session?.provider_token;

      // If user is logged in with email, provider_token is usually missing.
      // Use our backend token refresh (requires a Google refresh_token stored in profile).
      if (!providerToken) {
        const { data: refreshData, error: refreshError } = await supabase.functions.invoke("refresh-google-token", {
          body: { user_id: user.id },
        });

        if (refreshError) throw refreshError;

        if (!refreshData?.success || refreshData?.requires_reconnect || !refreshData?.access_token) {
          toast({
            title: t("reviewsPage.toastReconnect"),
            description: t("reviewsPage.toastReconnectDesc"),
            variant: "destructive",
          });
          return;
        }

        providerToken = refreshData.access_token;
      }

      const { data, error } = await supabase.functions.invoke("publish-google-reply", {
        body: { review_id: reviewId, provider_token: providerToken },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.success === false) throw new Error(data.message || "Impossible de publier.");

      toast({ title: t("reviewsPage.toastPublished") });
      // No need to fetchData - Realtime handles it
    } catch (error) {
      toast({ title: t("reviewsPage.toastError"), description: error instanceof Error ? error.message : t("reviewsPage.toastPublishFail"), variant: "destructive" });
    } finally {
      setPublishingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t("reviewsPage.toastCopied") });
  };

  // Get selected business - use useMemo to ensure it updates when businesses or selectedBusinessId changes
  const selectedBusiness = useMemo(() => {
    return businesses.find(b => b.id === selectedBusinessId);
  }, [businesses, selectedBusinessId]);

  // Filter reviews by selected business's google_place_id
  const businessReviews = useMemo(() => {
    if (!selectedBusiness?.google_place_id) return [];
    return reviews.filter(r => r.location_id === selectedBusiness.google_place_id);
  }, [reviews, selectedBusiness]);

  // Filters - A review is pending if NOT published to Google AND no google_reply
  // Also supports filtering by specific review_id from URL (notifications)
  const filteredReviews = useMemo(() => {
    // If filtering by specific review_id, find in all reviews (ignore business filter)
    if (filterReviewId) {
      const reviewById = reviews.find(r => r.id.toString() === filterReviewId);
      return reviewById ? [reviewById] : [];
    }

    return businessReviews.filter((review) => {
      const matchesSearch = review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRating = filterRating === "all" || review.rating === parseInt(filterRating);
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "pending" && !review.published_to_google && !review.google_reply) ||
        (filterStatus === "ready" && review.ai_response && !review.published_to_google && !review.google_reply) ||
        (filterStatus === "published" && (review.published_to_google || review.google_reply));
      return matchesSearch && matchesRating && matchesStatus;
    });
  }, [businessReviews, reviews, filterReviewId, searchTerm, filterRating, filterStatus]);

  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE);

  // Clear review_id filter function
  const clearReviewIdFilter = () => {
    setFilterReviewId(null);
    setSearchParams({});
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRating, filterStatus, selectedBusinessId, filterReviewId]);

  // A review is considered "replied" ONLY if published_to_google OR has google_reply (manual response)
  // Having just ai_response does NOT count as replied
  // Use Google's official total_reviews if available, otherwise fallback to local count
  const googleTotal = selectedBusiness?.total_reviews || 0;
  const displayTotal = googleTotal > 0 ? googleTotal : businessReviews.length;
  
  const stats = {
    total: displayTotal,
    pending: businessReviews.filter(r => !r.published_to_google && !r.google_reply).length,
    ready: businessReviews.filter(r => r.ai_response && !r.published_to_google && !r.google_reply).length,
    published: businessReviews.filter(r => r.published_to_google || r.google_reply).length,
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
    if (result?.success) {
      setLastSyncTime(new Date());
      fetchData(); // Refresh data after sync
    }
    if (result?.requires_reconnect) {
      toast({
        title: "Reconnexion requise",
        description: t("reviewsPage.toastSessionExpired"),
        variant: "destructive",
      });
    }
  };

  // Handle selecting a business when none are active
  const handleSelectBusiness = async () => {
    if (!user) return;
    
    const result = await syncBusinesses();
    if (result?.requires_selection) {
      setGoogleBusinessesForSelection(result.google_businesses || []);
      setMaxBusinessesLimit(result.max_businesses || 1);
      setShowSelectBusinessesDialog(true);
    } else if (result?.success) {
      fetchData(false);
    }
  };

  const handleBusinessSelectionSuccess = () => {
    setShowSelectBusinessesDialog(false);
    fetchData(false);
    toast({ title: t("reviewsPage.toastBusinessSelected"), description: t("reviewsPage.toastBusinessSelectedDesc") });
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">


      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Title */}
          <h1 className="text-lg font-bold text-foreground mb-3">{t("reviewsPage.title")}</h1>
          
          {/* Business card style selector */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-start gap-3">
              {/* Logo / Avatar */}
              <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
                <DialogTrigger asChild>
                  <button className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 overflow-hidden hover:shadow-md transition-all">
                    {selectedBusiness?.google_place_id ? (
                      <img 
                        src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                        alt="Google"
                        className="w-7 h-7"
                      />
                    ) : selectedBusiness ? (
                      <span className="text-xl font-bold text-primary">
                        {selectedBusiness.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("reviewsPage.yourBusinesses")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-1 mt-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : businesses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t("reviewsPage.noBusinessFound")}</p>
                        <p className="text-xs mt-1">{t("reviewsPage.connectGoogleHint")}</p>
                      </div>
                    ) : (
                      businesses.map((business) => {
                        const isSelected = selectedBusinessId === business.id;
                        const bgColor = `hsl(${business.name.charCodeAt(0) * 15 % 360}, 60%, 50%)`;
                        
                        return (
                          <button
                            key={business.id}
                            onClick={() => {
                              handleBusinessChange(business.id);
                              setBusinessDialogOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                              isSelected
                                ? "bg-muted"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                              style={{ backgroundColor: bgColor }}
                            >
                              {business.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium break-words">{business.name}</div>
                              {business.google_place_id && (
                                <div className="text-xs text-muted-foreground">{t("reviewsPage.connectedToGoogle")}</div>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Business info */}
              <div className="flex-1 min-w-0">
                {/* Badge + Actions row */}
                <div className="flex items-center gap-2 mb-1">
                  {selectedBusiness?.google_place_id ? (
                    <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Google
                    </span>
                  ) : selectedBusiness ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t("reviewsPage.manual")}</span>
                  ) : null}
                  
                  {/* Live + Sync on the right */}
                  <div className="flex items-center gap-2 ml-auto">
                    {isLive && lastUpdate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                        <span className="hidden sm:inline">{t("reviewsPage.live")}</span>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="h-7 w-7"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Business name - clickable to change */}
                <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 hover:opacity-70 transition-opacity text-left">
                      <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2">
                        {selectedBusiness ? selectedBusiness.name : t("reviewsPage.selectBusiness")}
                      </h3>
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </DialogTrigger>
                </Dialog>

                {/* Rating & Reviews - aligned under name */}
                {selectedBusiness && stats.total > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-semibold text-foreground">{averageRating.toFixed(1)}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({t("reviewsPage.averageReviews", { count: stats.total })})</span>
                  </div>
                )}

                {/* Last sync time */}
                {lastSyncTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("reviewsPage.syncTime", { time: formatTimeAgo(lastSyncTime) })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats - Clickable Filters */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: t("reviewsPage.total"), value: stats.total, bgGradient: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900", textColor: "text-slate-700 dark:text-slate-200", status: "all" },
              { label: t("reviewsPage.unanswered"), value: stats.pending, bgGradient: "from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40", textColor: "text-red-600 dark:text-red-400", status: "pending" },
              { label: t("reviewsPage.aiResponse"), value: stats.ready, bgGradient: "from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40", textColor: "text-primary", status: "ready" },
              { label: t("reviewsPage.published"), value: stats.published, bgGradient: "from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40", textColor: "text-green-600 dark:text-green-400", status: "published" },
            ].map((stat) => (
              <button
                key={stat.label}
                onClick={() => setFilterStatus(stat.status)}
                className={`rounded-xl p-3 text-center transition-all bg-gradient-to-br ${stat.bgGradient} ${
                  filterStatus === stat.status 
                    ? "ring-2 ring-offset-2 ring-offset-background ring-primary/50 shadow-md" 
                    : "hover:shadow-sm opacity-80 hover:opacity-100"
                }`}
              >
                <div className={`text-xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">

        {/* Single review filter banner (when coming from notification) */}
        {filterReviewId && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">
                {t("reviewsPage.showingFromNotif")}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearReviewIdFilter}
              className="gap-1.5"
            >
              {t("reviewsPage.seeAllReviews")}
            </Button>
          </div>
        )}

        {/* Google-style Star Rating Filter */}
        {selectedBusinessId && !filterReviewId && (
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
                  placeholder={t("reviewsPage.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("reviewsPage.status")} />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">{t("reviewsPage.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("reviewsPage.pending")}</SelectItem>
                  <SelectItem value="ready">{t("reviewsPage.ready")}</SelectItem>
                  <SelectItem value="published">{t("reviewsPage.publishedBadge")}</SelectItem>
                </SelectContent>
              </Select>
              {filterRating !== "all" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground"
                  onClick={() => setFilterRating("all")}
                >{t("reviewsPage.resetFilter")}</Button>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Reviews List */}
        {businesses.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t("reviewsPage.noBusinessSelectedTitle")}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t("reviewsPage.noBusinessSelectedDesc")}
            </p>
            <Button onClick={handleSelectBusiness} disabled={isSyncingBusinesses}>
              {isSyncingBusinesses ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("reviewsPage.loading")}</>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />{t("reviewsPage.selectABusiness")}</>
              )}
            </Button>
          </div>
        ) : !selectedBusinessId ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t("reviewsPage.selectBusiness")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("reviewsPage.chooseBusinessAbove")}
            </p>
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t("reviewsPage.noReviews")}</h2>
            <p className="text-muted-foreground text-sm">
              {businessReviews.length === 0 ? t("reviewsPage.syncToStart") : t("reviewsPage.noResultsFilters")}
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        {review.needs_new_response && (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-destructive/30 text-destructive bg-destructive/5"
                          >
                            <RefreshCw className="w-3 h-3" /> {t("reviewsPage.regenerate")}
                          </Badge>
                        )}
                        {/* Status Badge */}
                        {review.published_to_google ? (
                          <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3" /> {t("reviewsPage.publishedBadge")}</Badge>
                        ) : review.google_reply ? (
                          <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><MessageSquare className="w-3 h-3" /> {t("reviewsPage.replied")}</Badge>
                        ) : review.ai_response ? (
                          <Badge className="text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20"><BrandSparkle className="w-3 h-3" /> {t("reviewsPage.aiReady")}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" /> {t("reviewsPage.pending")}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.review_date).toLocaleDateString(dateLocale)}
                      </span>
                    </div>

                    {review.comment && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 cursor-pointer hover:text-foreground transition-colors">
                            {review.comment}
                          </p>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {review.author.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span>{review.author}</span>
                                <div className="flex mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                                  ))}
                                </div>
                              </div>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                            <p className="text-xs text-muted-foreground/60 mt-3">
                              {new Date(review.review_date).toLocaleDateString(dateLocale, {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Review Photos */}
                    {(() => {
                      const photos = parsePhotos(review.photos);
                      if (photos.length === 0) return null;
                      return (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                          {photos.slice(0, 4).map((photo, idx) => (
                            <a
                              key={idx}
                              href={photo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <img
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="w-16 h-16 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ))}
                          {photos.length > 4 && (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground font-medium flex-shrink-0">
                              +{photos.length - 4}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Criteria/Aspects (for hotels, restaurants, etc.) */}
                    {(() => {
                      const criteria = parseCriteria(review.criteria);
                      if (!criteria || Object.keys(criteria).length === 0) return null;
                      const labelMap: Record<string, string> = {
                        rooms: t("reviewsPage.criteria.rooms"),
                        service: t("reviewsPage.criteria.service"),
                        location: t("reviewsPage.criteria.location"),
                        cleanliness: t("reviewsPage.criteria.cleanliness"),
                        food: t("reviewsPage.criteria.food"),
                        value: t("reviewsPage.criteria.value"),
                        atmosphere: t("reviewsPage.criteria.atmosphere"),
                        amenities: t("reviewsPage.criteria.amenities"),
                      };
                      return (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(criteria).map(([key, value]) => {
                            if (!value) return null;
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full text-xs"
                              >
                                <span className="text-muted-foreground capitalize">
                                  {labelMap[key] || key}:
                                </span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-2.5 h-2.5 ${
                                        i < value ? "text-accent fill-accent" : "text-muted-foreground/30"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Google Reply (existing manual response) */}
                    {review.google_reply && !review.ai_response && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                            <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-medium mb-1">
                              <CheckCircle className="w-3 h-3" /> {t("reviewsPage.response")}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{review.google_reply}</p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-green-600" />
                              {t("reviewsPage.reviewBy", { name: review.author })}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                              Review details and existing response.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            {/* Rating section */}
                            <div className="flex items-center gap-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                              ))}
                              <span className="text-sm font-medium">{review.rating}/5</span>
                              <span className="text-sm text-muted-foreground">• {new Date(review.review_date).toLocaleDateString(dateLocale)}</span>
                            </div>
                            
                            {/* Client comment */}
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground font-medium mb-1">{t("reviewsPage.customerReview")}</p>
                              <p className="text-sm text-foreground">{review.comment || t("reviewsPage.noComment")}</p>
                            </div>
                            
                            {/* Existing Google Response */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-medium mb-2">
                                <CheckCircle className="w-3 h-3" /> {t("reviewsPage.existingResponse")}
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{review.google_reply}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* AI Response */}
                    {review.ai_response && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors">
                            <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
                              <BrandSparkle className="w-3 h-3" /> {t("reviewsPage.aiResponseLabel")}
                              {review.needs_new_response && (
                                <span className="ml-2 text-destructive font-semibold">{t("reviewsPage.editedReview")}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{review.ai_response}</p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-primary" />
                              {t("reviewsPage.reviewBy", { name: review.author })}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                              Review details and AI response.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            {/* Rating section */}
                            <div className="flex items-center gap-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                              ))}
                              <span className="text-sm font-medium">{review.rating}/5</span>
                              <span className="text-sm text-muted-foreground">• {new Date(review.review_date).toLocaleDateString(dateLocale)}</span>
                            </div>
                            
                            {/* Client comment */}
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground font-medium mb-1">{t("reviewsPage.customerReview")}</p>
                              <p className="text-sm text-foreground">{review.comment || t("reviewsPage.noComment")}</p>
                            </div>
                            
                            {/* AI Response */}
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
                                <BrandSparkle className="w-3 h-3" /> {t("reviewsPage.aiResponseLabel")}
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{review.ai_response}</p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => copyToClipboard(review.ai_response!)}>
                                <Copy className="w-4 h-4 mr-2" /> {t("reviewsPage.copy")}
                              </Button>
                              {!review.published_to_google && (
                                <Button size="sm" className="flex-1" onClick={() => publishToGoogle(review.id)} disabled={publishingId === review.id}>
                                  {publishingId === review.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                  Publier
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {/* If has existing Google reply but no AI response - allow regenerating */}
                      {review.google_reply && !review.ai_response ? (
                        <Button size="sm" variant="outline" onClick={() => generateAIResponse(review.id)} disabled={generatingId === review.id}>
                          {generatingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrandSparkle className="w-4 h-4" />}
                          <span className="ml-1.5">{t("reviewsPage.iaResponseBtn")}</span>
                        </Button>
                      ) : !review.ai_response ? (
                        <Button size="sm" onClick={() => generateAIResponse(review.id)} disabled={generatingId === review.id}>
                          {generatingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrandSparkle className="w-4 h-4" />}
                          <span className="ml-1.5">{t("reviewsPage.generate")}</span>
                        </Button>
                      ) : !review.published_to_google ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => publishToGoogle(review.id)} disabled={publishingId === review.id}>
                            {publishingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span className="ml-1.5">{t("reviewsPage.publish")}</span>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(review.ai_response!)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => generateAIResponse(review.id)} disabled={generatingId === review.id}>
                            <RefreshCw className={`w-4 h-4 ${generatingId === review.id ? "animate-spin" : ""} ${review.needs_new_response ? "text-destructive" : ""}`} />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(review.ai_response!)}>
                          <Copy className="w-4 h-4 mr-1.5" /> {t("reviewsPage.copy")}
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
            <Button variant="outline" size="sm" onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {currentPage} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <MobileBottomNav />
      
      {/* Upgrade Dialog for insufficient credits */}
      <UpgradeDialog 
        open={upgradeDialogOpen} 
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={currentPlan || undefined}
      />
      
      {/* Response Preview Dialog - after AI generation */}
      <ResponsePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        review={previewReview}
        onPublish={publishToGoogle}
        publishingId={publishingId}
      />
      
      {/* Business Selection Dialog */}
      <SelectBusinessesDialog
        open={showSelectBusinessesDialog}
        onOpenChange={setShowSelectBusinessesDialog}
        businesses={googleBusinessesForSelection}
        maxBusinesses={maxBusinessesLimit}
        userId={user?.id || ""}
        onSuccess={handleBusinessSelectionSuccess}
      />
    </div>
  );
};

export default Reviews;