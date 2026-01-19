import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
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
  Check
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
}

const toneOptions = [
  { value: "professional", label: "Professionnel", icon: Briefcase },
  { value: "friendly", label: "Amical", icon: Smile },
  { value: "humorous", label: "Humoristique", icon: Sun },
  { value: "warm", label: "Chaleureux", icon: Heart },
];

const lengthOptions = [
  { value: "S", label: "Court", desc: "2-3" },
  { value: "M", label: "Moyen", desc: "4-5" },
  { value: "L", label: "Long", desc: "6+" },
];

const AISettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AISettings>({
    enabled: true,
    tone: "friendly",
    response_length: "M",
    include_signature: true,
    signature: "L'équipe {business_name}",
    custom_template: "",
    auto_reply_delay: 5,
    only_positive_reviews: false,
    minimum_rating: 3,
    auto_sync_reviews: true,
    sync_interval_minutes: 30,
    auto_publish_to_google: false,
    email_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Use subscription verification hook
  const { loading: subscriptionLoading } = useRequireSubscription();

  useEffect(() => {
    if (subscriptionLoading || !user) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("ai_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching AI settings:", error);
      } else if (data) {
        setSettings({
          enabled: data.enabled ?? true,
          tone: data.tone ?? "friendly",
          response_length: data.response_length ?? "M",
          include_signature: data.include_signature ?? true,
          signature: data.signature ?? "L'équipe {business_name}",
          custom_template: data.custom_template || "",
          auto_reply_delay: data.auto_reply_delay ?? 5,
          only_positive_reviews: data.only_positive_reviews ?? false,
          minimum_rating: data.minimum_rating ?? 3,
          auto_sync_reviews: data.auto_sync_reviews ?? true,
          sync_interval_minutes: data.sync_interval_minutes ?? 30,
          auto_publish_to_google: data.auto_publish_to_google ?? false,
          email_notifications: data.email_notifications ?? true,
        });
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user, navigate]);

  const saveSettings = useCallback(async (newSettings: AISettings) => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("ai_settings")
      .upsert({
        user_id: user.id,
        ...newSettings,
      });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [user]);

  // Auto-save with debounce
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveSettings(settings);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings, saveSettings]);

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
              <h1 className="text-lg font-bold text-foreground">Paramètres IA</h1>
              <p className="text-xs text-muted-foreground">Personnalisez vos réponses</p>
            </div>
            <div className="flex items-center gap-2 h-8">
              {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {saved && <Check className="w-4 h-4 text-green-500" />}
            </div>
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
                  Réponses IA
                </h3>
                <p className={`text-sm ${settings.enabled ? "text-white/70" : "text-muted-foreground"}`}>
                  {settings.enabled ? "Activé" : "Désactivé"}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
              className="data-[state=checked]:bg-white/30"
            />
          </div>
          {settings.enabled && (
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          )}
        </div>

        {/* Tone Selection - Pill Style */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm text-foreground">Ton</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {toneOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, tone: option.value })}
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
            <h3 className="font-medium text-sm text-foreground">Longueur</h3>
          </div>
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
            {lengthOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, response_length: option.value })}
                className={`flex-1 py-3 rounded-lg text-center transition-all ${
                  settings.response_length === option.value
                    ? "bg-background shadow-sm text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-[10px] opacity-70">{option.desc} phrases</div>
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
                  setSettings({ ...settings, include_signature })
                }
              />
            </div>
            {settings.include_signature && (
              <Input
                value={settings.signature}
                onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                placeholder="L'équipe {business_name}"
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
                <span className="font-medium text-sm text-foreground">Délai réponse</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={settings.auto_reply_delay}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_reply_delay: parseInt(e.target.value) || 0 })
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
                <span className="font-medium text-sm text-foreground">Avis positifs seulement</span>
              </div>
              <Switch
                checked={settings.only_positive_reviews}
                onCheckedChange={(only_positive_reviews) =>
                  setSettings({ ...settings, only_positive_reviews })
                }
              />
            </div>
          </div>

          {/* Minimum rating */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <span className="font-medium text-sm text-foreground">Note minimum</span>
            </div>
            <div className="flex gap-2 pl-11">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSettings({ ...settings, minimum_rating: rating })}
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
                  <span className="font-medium text-sm text-foreground block">Auto-sync</span>
                  <span className="text-xs text-muted-foreground">Importer les avis</span>
                </div>
              </div>
              <Switch
                checked={settings.auto_sync_reviews}
                onCheckedChange={(auto_sync_reviews) =>
                  setSettings({ ...settings, auto_sync_reviews })
                }
              />
            </div>
            {settings.auto_sync_reviews && (
              <div className="flex gap-2 mt-3 pl-11 overflow-x-auto pb-1">
                {[15, 30, 60, 120].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setSettings({ ...settings, sync_interval_minutes: interval })}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      settings.sync_interval_minutes === interval
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {interval < 60 ? `${interval}min` : `${interval / 60}h`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">Auto-publish</span>
                  <span className="text-xs text-muted-foreground">Vers Google</span>
                </div>
              </div>
              <Switch
                checked={settings.auto_publish_to_google}
                onCheckedChange={(auto_publish_to_google) =>
                  setSettings({ ...settings, auto_publish_to_google })
                }
              />
            </div>
            {settings.auto_publish_to_google && (
              <div className="mt-3 ml-11 bg-amber-500/10 rounded-xl p-3 flex items-start gap-2">
                <Bell className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Réponses publiées après {settings.auto_reply_delay} min
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
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <span className="font-medium text-sm text-foreground block">Notifications email</span>
                  <span className="text-xs text-muted-foreground">Nouveaux avis</span>
                </div>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(email_notifications) =>
                  setSettings({ ...settings, email_notifications })
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
            onChange={(e) => setSettings({ ...settings, custom_template: e.target.value })}
            placeholder="Ajoutez des instructions pour l'IA..."
            rows={3}
            className="rounded-xl bg-muted/50 border-0 resize-none text-sm"
          />
        </div>

        {/* Auto-save indicator */}
        {(saving || saved) && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
            {saving && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            )}
            {saved && !saving && (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Enregistré</span>
              </>
            )}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AISettingsPage;
