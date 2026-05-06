import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { 
  Sparkles,
  MessageSquare,
  Clock,
  Star,
  Loader2,
  RefreshCw,
  Bell,
  Briefcase,
  Heart,
  Smile,
  Sun,
  PenLine,
  ThumbsUp,
  Upload,
  Check,
  History,
  Coins,
  AlertTriangle
} from "lucide-react";

interface AISettings {
  enabled: boolean;
  tone: string;
  response_length: string;
  include_signature: boolean;
  signature: string;
  custom_template: string;
  auto_reply_delay: number;
  only_positive_reviews: boolean;
  minimum_rating: number;
  auto_sync_reviews: boolean;
  sync_interval_minutes: number;
  auto_publish_to_google: boolean;
  email_notifications: boolean;
  respond_to_edited_reviews: boolean;
  publication_hour: number;
  timezone: string;
}

interface PendingReviewsStats {
  oldReviews: number; // Reviews without AI response that are older than enabled_at
  newReviews: number; // Reviews without AI response that are newer than enabled_at
}

const getToneOptions = (isEN: boolean) => [
  { value: "professional", label: isEN ? "Professional" : "Professionnel", icon: Briefcase },
  { value: "friendly", label: isEN ? "Friendly" : "Amical", icon: Smile },
  { value: "humorous", label: isEN ? "Humorous" : "Humoristique", icon: Sun },
  { value: "warm", label: isEN ? "Warm" : "Chaleureux", icon: Heart },
];

const getLengthOptions = (isEN: boolean) => [
  { value: "S", label: isEN ? "Short" : "Court", desc: "2-3" },
  { value: "M", label: isEN ? "Medium" : "Moyen", desc: "4-5" },
  { value: "L", label: isEN ? "Long" : "Long", desc: "6+" },
];

// Subcomponent for old reviews
const OldReviewsSection = ({ 
  oldReviewsCount, 
  userId,
  currentPlan,
  onComplete 
}: { 
  oldReviewsCount: number; 
  userId: string;
  currentPlan?: string | null;
  onComplete: () => void;
}) => {
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const creditsNeeded = oldReviewsCount;

  const handleGenerateOldReviews = async () => {
    setLoading(true);
    try {
      // Check if user has enough credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (!profile || profile.credits < creditsNeeded) {
        toast({
          title: isEN ? "Insufficient credits" : "Crédits insuffisants",
          description: isEN
            ? `You have ${profile?.credits || 0} credits. You need ${creditsNeeded} credits to process all old reviews.`
            : `Vous avez ${profile?.credits || 0} crédits. Il vous faut ${creditsNeeded} crédits pour traiter tous les anciens avis.`,
          variant: "destructive",
        });
        setUpgradeOpen(true);
        setLoading(false);
        return;
      }

      // Call edge function to process old reviews
      const { error } = await supabase.functions.invoke("generate-old-reviews-batch", {
        body: { userId }
      });

      if (error) throw error;

      toast({
        title: isEN ? "Processing started" : "Traitement démarré",
        description: isEN
          ? `Generating replies for ${oldReviewsCount} old reviews...`
          : `Génération des réponses pour ${oldReviewsCount} anciens avis en cours...`,
      });
      
      onComplete();
    } catch (error) {
      console.error("Error generating old reviews:", error);
      toast({
        title: isEN ? "Error" : "Erreur",
        description: isEN
          ? "Unable to start processing old reviews."
          : "Impossible de démarrer le traitement des anciens avis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <History className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-foreground">
              {isEN ? "Old reviews without reply" : "Anciens avis sans réponse"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEN ? "Reviews received before AI activation" : "Avis reçus avant l'activation de l'IA"}
            </p>
          </div>
        </div>
        
        <div className="bg-background/50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{isEN ? "Reviews to process" : "Avis à traiter"}</span>
            <span className="font-bold text-lg text-foreground">{oldReviewsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> {isEN ? "Credits required" : "Crédits requis"}
            </span>
            <span className="font-bold text-lg text-primary">{creditsNeeded}</span>
          </div>
        </div>
        
        <Button
          onClick={handleGenerateOldReviews}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEN ? "Processing..." : "Traitement..."}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {isEN ? `Generate replies (${creditsNeeded} credits)` : `Générer les réponses (${creditsNeeded} crédits)`}
            </>
          )}
        </Button>
      </div>
      
      <UpgradeDialog 
        open={upgradeOpen} 
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan || undefined}
      />
    </>
  );
};

const AISettingsPage = () => {
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const toneOptions = getToneOptions(isEN);
  const lengthOptions = getLengthOptions(isEN);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AISettings>({
    enabled: true,
    tone: "friendly",
    response_length: "M",
    include_signature: true,
    signature: "The {business_name} team",
    custom_template: "",
    auto_reply_delay: 5,
    only_positive_reviews: true,
    minimum_rating: 3,
    auto_sync_reviews: true,
    sync_interval_minutes: 30,
    auto_publish_to_google: true,
    email_notifications: true,
    respond_to_edited_reviews: true,
    publication_hour: 7,
    timezone: "Europe/Paris",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingStats, setPendingStats] = useState<PendingReviewsStats>({ oldReviews: 0, newReviews: 0 });
  const [negativeReviewsCount, setNegativeReviewsCount] = useState(0);
  const [userCredits, setUserCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [generatingOld, setGeneratingOld] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const initialSettingsRef = useRef<AISettings | null>(null);

  // Use subscription verification hook
  const { loading: subscriptionLoading } = useRequireSubscription();

  useEffect(() => {
    if (subscriptionLoading || !user) return;

    const fetchSettings = async () => {
      // Fetch settings, reviews, and profile in parallel
      const [settingsRes, reviewsRes, aiSettingsDateRes, negativeReviewsRes, profileRes] = await Promise.all([
        supabase
          .from("ai_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("id, created_at, ai_response")
          .eq("user_id", user.id)
          .is("ai_response", null),
        supabase
          .from("ai_settings")
          .select("created_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        // Count negative reviews (rating < 4) without AI response
        supabase
          .from("reviews")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .is("ai_response", null)
          .is("google_reply", null)
          .lt("rating", 4),
        supabase
          .from("profiles")
          .select("credits, plan_name")
          .eq("id", user.id)
          .single()
      ]);

      if (settingsRes.error) {
        console.error("Error fetching AI settings:", settingsRes.error);
      } else if (settingsRes.data) {
        setSettingsId(settingsRes.data.id);
        setSettings({
          enabled: settingsRes.data.enabled ?? true,
          tone: settingsRes.data.tone ?? "friendly",
          response_length: settingsRes.data.response_length ?? "M",
          include_signature: settingsRes.data.include_signature ?? true,
          signature: settingsRes.data.signature ?? "The {business_name} team",
          custom_template: settingsRes.data.custom_template || "",
          auto_reply_delay: settingsRes.data.auto_reply_delay ?? 5,
          only_positive_reviews: settingsRes.data.only_positive_reviews ?? true,
          minimum_rating: settingsRes.data.minimum_rating ?? 3,
          auto_sync_reviews: settingsRes.data.auto_sync_reviews ?? true,
          sync_interval_minutes: settingsRes.data.sync_interval_minutes ?? 30,
          auto_publish_to_google: settingsRes.data.auto_publish_to_google ?? true,
          email_notifications: settingsRes.data.email_notifications ?? true,
          respond_to_edited_reviews: settingsRes.data.respond_to_edited_reviews ?? true,
          publication_hour: (settingsRes.data as any).publication_hour ?? 7,
          timezone: (settingsRes.data as any).timezone ?? "Europe/Paris",
        });
      }

      // Calculate old vs new reviews
      if (reviewsRes.data && aiSettingsDateRes.data?.created_at) {
        const enabledAt = new Date(aiSettingsDateRes.data.created_at);
        const oldReviews = reviewsRes.data.filter(r => new Date(r.created_at) < enabledAt).length;
        const newReviews = reviewsRes.data.filter(r => new Date(r.created_at) >= enabledAt).length;
        setPendingStats({ oldReviews, newReviews });
      } else if (reviewsRes.data) {
        // If no settings date, consider all as new
        setPendingStats({ oldReviews: reviewsRes.data.length, newReviews: 0 });
      }

      // Set negative reviews count
      setNegativeReviewsCount(negativeReviewsRes.count || 0);
      
      // Set user credits and plan
      setUserCredits(profileRes.data?.credits || 0);
      setCurrentPlan(profileRes.data?.plan_name || null);

      setLoading(false);
    };

    fetchSettings();
  }, [user, subscriptionLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    let error;
    if (settingsId) {
      // Update existing record
      const result = await supabase
        .from("ai_settings")
        .update(settings)
        .eq("id", settingsId);
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from("ai_settings")
        .insert({
          user_id: user.id,
          ...settings,
        })
        .select("id")
        .single();
      error = result.error;
      if (!error && result.data) {
        setSettingsId(result.data.id);
      }
    }

    setSaving(false);
    if (error) {
      console.error("Error saving AI settings:", error);
      toast({
        title: isEN ? "Error" : "Erreur",
        description: isEN ? "Unable to save settings." : "Impossible d'enregistrer les paramètres.",
        variant: "destructive",
      });
    } else {
      toast({
        title: isEN ? "Saved" : "Enregistré",
        description: isEN ? "Your AI settings have been saved." : "Vos paramètres IA ont été enregistrés.",
      });
      setHasChanges(false);
      initialSettingsRef.current = settings;
    }
  };

  const updateSettings = (newSettings: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    setHasChanges(true);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <DashboardHeader />

      {/* Compact Mobile Header */}
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{isEN ? "AI Settings" : "Paramètres IA"}</h1>
              <p className="text-xs text-muted-foreground">{isEN ? "Customize your replies" : "Personnalisez vos réponses"}</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              size="sm"
              className="rounded-xl"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  {isEN ? "Save" : "Enregistrer"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <main className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        {/* Master Toggle - Hero Card */}
        <div className={`relative overflow-hidden rounded-3xl p-5 transition-all duration-300 ${
          settings.enabled 
            ? "bg-gradient-to-br from-primary via-primary to-primary/80 shadow-xl shadow-primary/30" 
            : "bg-card border border-border"
        }`}>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                settings.enabled ? "bg-white/20" : "bg-muted"
              }`}>
                <Sparkles className={`w-6 h-6 ${settings.enabled ? "text-white" : "text-muted-foreground"}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${settings.enabled ? "text-white" : "text-foreground"}`}>
                  {isEN ? "AI Replies" : "Réponses IA"}
                </h3>
                <p className={`text-sm ${settings.enabled ? "text-white/70" : "text-muted-foreground"}`}>
                  {settings.enabled ? (isEN ? `Auto after ${settings.auto_reply_delay || 5} min` : `Auto après ${settings.auto_reply_delay || 5} min`) : (isEN ? "Disabled" : "Désactivé")}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
              className="data-[state=checked]:bg-white/30"
            />
          </div>
          {settings.enabled && (
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          )}
        </div>

        {/* Tonee Selection - Pill Style */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm text-foreground">{isEN ? "Tone" : "Ton"}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {toneOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSettings({ tone: option.value })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-left transition-all ${
                  settings.tone === option.value
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                <option.icon className={`w-4 h-4 ${settings.tone === option.value ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span className="font-medium text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Response Length - Segmented Control */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm text-foreground">{isEN ? "Length" : "Longueur"}</h3>
          </div>
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
            {lengthOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSettings({ response_length: option.value })}
                className={`flex-1 py-3 rounded-lg text-center transition-all ${
                  settings.response_length === option.value
                    ? "bg-background shadow-sm text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-[10px] opacity-70">{option.desc} {isEN ? "sentences" : "phrases"}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings List - iOS Style */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          {/* Signature */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <PenLine className="w-4 h-4 text-blue-500" />
                </div>
                <span className="font-medium text-sm text-foreground">Signature</span>
              </div>
              <Switch
                checked={settings.include_signature}
                onCheckedChange={(include_signature) =>
                  updateSettings({ include_signature })
                }
              />
            </div>
            {settings.include_signature && (
              <Input
                value={settings.signature}
                onChange={(e) => updateSettings({ signature: e.target.value })}
                placeholder="The {business_name} team"
                className="mt-3 rounded-xl bg-muted/50 border-0"
              />
            )}
          </div>

          {/* Delay */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <span className="font-medium text-sm text-foreground">{isEN ? "Reply delay" : "Délai de réponse"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={settings.auto_reply_delay}
                  onChange={(e) =>
                    updateSettings({ auto_reply_delay: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 text-center rounded-xl bg-muted/50 border-0 h-9"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          {/* Positive only */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground">{isEN ? "Positive reviews only" : "Avis positifs uniquement"}</span>
                  <p className="text-xs text-muted-foreground">{isEN ? "Rating ≥ 4 stars" : "Note ≥ 4 étoiles"}</p>
                </div>
              </div>
              <Switch
                checked={settings.only_positive_reviews}
                onCheckedChange={(only_positive_reviews) =>
                  updateSettings({ only_positive_reviews })
                }
              />
            </div>
            
            {/* Warning when disabled - show negative reviews estimate */}
            {!settings.only_positive_reviews && negativeReviewsCount > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      {isEN
                        ? `${negativeReviewsCount} negative review${negativeReviewsCount > 1 ? 's' : ''} to process`
                        : `${negativeReviewsCount} avis négatif${negativeReviewsCount > 1 ? 's' : ''} à traiter`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isEN ? "Estimated cost: " : "Coût estimé : "}<span className="font-semibold text-foreground">{negativeReviewsCount} {isEN ? `credit${negativeReviewsCount > 1 ? 's' : ''}` : `crédit${negativeReviewsCount > 1 ? 's' : ''}`}</span>
                    </p>
                    {userCredits < negativeReviewsCount && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUpgradeOpen(true)}
                        className="mt-2 h-7 text-xs rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                      >
                        <Coins className="w-3 h-3 mr-1" />
                        {isEN ? `Buy credits (${userCredits} available)` : `Acheter des crédits (${userCredits} disponibles)`}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Minimum rating */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <span className="font-medium text-sm text-foreground">{isEN ? "Minimum rating" : "Note minimale"}</span>
            </div>
            <div className="flex gap-2 pl-11">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => updateSettings({ minimum_rating: rating })}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all ${
                    settings.minimum_rating === rating
                      ? "bg-yellow-500 text-white shadow-md shadow-yellow-500/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">{isEN ? "Auto sync" : "Sync auto"}</span>
                  <span className="text-xs text-muted-foreground">{isEN ? "Import reviews" : "Importer les avis"}</span>
                </div>
              </div>
              <Switch
                checked={settings.auto_sync_reviews}
                onCheckedChange={(auto_sync_reviews) =>
                  updateSettings({ auto_sync_reviews })
                }
              />
            </div>
            {/* Interval selector hidden - default is 30 seconds via cron */}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">{isEN ? "Auto publish" : "Publication auto"}</span>
                  <span className="text-xs text-muted-foreground">{isEN ? "To Google" : "Vers Google"}</span>
                </div>
              </div>
              <Switch
                checked={settings.auto_publish_to_google}
                onCheckedChange={(auto_publish_to_google) =>
                  updateSettings({ auto_publish_to_google })
                }
              />
            </div>
            {settings.auto_publish_to_google && (
              <div className="mt-3 ml-11 bg-amber-500/10 rounded-xl p-3 flex items-start gap-2">
                <Bell className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {isEN ? `Replies published after ${settings.auto_reply_delay} min` : `Réponses publiées après ${settings.auto_reply_delay} min`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SEO/AEO Publication Hour with Timezone */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">Heure de publication SEO/AEO</span>
                  <span className="text-xs text-muted-foreground">Articles & Q&R automatiques</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={settings.publication_hour}
                  onChange={(e) => updateSettings({ publication_hour: parseInt(e.target.value) })}
                  className="h-9 px-3 rounded-xl bg-muted/50 border-0 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Timezone Selector */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">Fuseau horaire</span>
                  <span className="text-xs text-muted-foreground">Pour la publication automatisée</span>
                </div>
              </div>
              <select
                value={settings.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                className="h-9 px-3 rounded-xl bg-muted/50 border-0 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary max-w-[180px]"
              >
                <optgroup label="Europe">
                  <option value="Europe/Paris">Paris (France)</option>
                  <option value="Europe/Brussels">Bruxelles (Belgique)</option>
                  <option value="Europe/Zurich">Zurich (Suisse)</option>
                  <option value="Europe/Luxembourg">Luxembourg</option>
                  <option value="Europe/Monaco">Monaco</option>
                  <option value="Europe/London">Londres (Royaume-Uni)</option>
                  <option value="Europe/Berlin">Berlin (Allemagne)</option>
                  <option value="Europe/Madrid">Madrid (Espagne)</option>
                  <option value="Europe/Rome">Rome (Italie)</option>
                  <option value="Europe/Amsterdam">Amsterdam (Pays-Bas)</option>
                </optgroup>
                <optgroup label="Amériques">
                  <option value="America/Montreal">Montréal (Canada)</option>
                  <option value="America/New_York">New York (États-Unis)</option>
                  <option value="America/Los_Angeles">Los Angeles (États-Unis)</option>
                  <option value="America/Chicago">Chicago (États-Unis)</option>
                  <option value="America/Toronto">Toronto (Canada)</option>
                  <option value="America/Martinique">Martinique</option>
                  <option value="America/Guadeloupe">Guadeloupe</option>
                  <option value="America/Cayenne">Guyane française</option>
                </optgroup>
                <optgroup label="Afrique">
                  <option value="Africa/Casablanca">Casablanca (Maroc)</option>
                  <option value="Africa/Algiers">Alger (Algérie)</option>
                  <option value="Africa/Tunis">Tunis (Tunisie)</option>
                  <option value="Africa/Dakar">Dakar (Sénégal)</option>
                  <option value="Africa/Abidjan">Abidjan (Côte d'Ivoire)</option>
                </optgroup>
                <optgroup label="Océan Indien">
                  <option value="Indian/Reunion">La Réunion</option>
                  <option value="Indian/Mauritius">Maurice</option>
                  <option value="Indian/Mayotte">Mayotte</option>
                </optgroup>
                <optgroup label="Pacifique">
                  <option value="Pacific/Noumea">Nouvelle-Calédonie</option>
                  <option value="Pacific/Tahiti">Tahiti</option>
                </optgroup>
              </select>
            </div>
            <div className="mt-3 ml-11 bg-indigo-500/10 rounded-xl p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                Le contenu SEO/AEO sera publié à {settings.publication_hour.toString().padStart(2, "0")}:00 heure locale ({settings.timezone.split('/')[1]?.replace('_', ' ') || settings.timezone})
              </p>
            </div>
          </div>
        </div>

        {/* Respond to Edited Reviews */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <PenLine className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">Avis modifiés</span>
                  <span className="text-xs text-muted-foreground">Régénérer la réponse IA</span>
                </div>
              </div>
              <Switch
                checked={settings.respond_to_edited_reviews}
                onCheckedChange={(respond_to_edited_reviews) =>
                  updateSettings({ respond_to_edited_reviews })
                }
              />
            </div>
            {settings.respond_to_edited_reviews && (
              <div className="mt-3 ml-11 bg-orange-500/10 rounded-xl p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  Une nouvelle réponse sera générée si le client modifie son avis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">Notifications e-mail</span>
                  <span className="text-xs text-muted-foreground">Nouveaux avis</span>
                </div>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(email_notifications) =>
                  updateSettings({ email_notifications })
                }
              />
            </div>
          </div>
        </div>

        {/* Custom Template */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="font-medium text-sm text-foreground">Instructions personnalisées</h3>
          </div>
          <Textarea
            value={settings.custom_template}
            onChange={(e) => updateSettings({ custom_template: e.target.value })}
            placeholder="Add instructions for the AI..."
            rows={3}
            className="rounded-xl bg-muted/50 border-0 resize-none text-sm"
          />
        </div>

        {/* Old Reviews Section */}
        {pendingStats.oldReviews > 0 && (
          <OldReviewsSection 
            oldReviewsCount={pendingStats.oldReviews}
            userId={user?.id || ""}
            currentPlan={currentPlan}
            onComplete={() => setPendingStats(prev => ({ ...prev, oldReviews: 0 }))}
          />
        )}
      </main>

      <MobileBottomNav />
      <UpgradeDialog 
        open={upgradeOpen} 
        onOpenChange={setUpgradeOpen} 
        currentPlan={currentPlan || undefined}
      />
    </div>
  );
};

export default AISettingsPage;
