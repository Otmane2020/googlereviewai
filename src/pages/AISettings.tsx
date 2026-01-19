import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Sparkles,
  MessageSquare,
  Clock,
  Star,
  Save,
  Loader2,
  RefreshCw,
  Send,
  Bell
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
}

const toneOptions = [
  { value: "professional", label: "Professionnel", description: "Ton formel et courtois" },
  { value: "friendly", label: "Amical", description: "Ton chaleureux et accessible" },
  { value: "humorous", label: "Humoristique", description: "Ton léger et amusant" },
  { value: "warm", label: "Chaleureux", description: "Ton empathique et bienveillant" },
];

const lengthOptions = [
  { value: "S", label: "Court", description: "2-3 phrases" },
  { value: "M", label: "Moyen", description: "4-5 phrases" },
  { value: "L", label: "Long", description: "6+ phrases" },
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

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
        });
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("ai_settings")
      .upsert({
        user_id: user.id,
        ...settings,
      });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres IA ont été mis à jour.",
      });
    }
    setSaving(false);
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

      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Paramètres IA</h1>
              <p className="text-sm text-muted-foreground">
                Configurez le comportement de l'IA pour vos réponses
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Enable/Disable */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Réponses automatiques IA</h3>
                <p className="text-sm text-muted-foreground">
                  Activez la génération automatique de réponses aux avis
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
            />
          </div>
        </div>

        {/* Tone selection */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Ton des réponses</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {toneOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, tone: option.value })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  settings.tone === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <h4 className="font-medium text-foreground">{option.label}</h4>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Response length */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Longueur des réponses</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {lengthOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, response_length: option.value })}
                className={`p-4 rounded-xl border text-center transition-all ${
                  settings.response_length === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <h4 className="font-medium text-foreground">{option.label}</h4>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Signature */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Signature</h3>
            </div>
            <Switch
              checked={settings.include_signature}
              onCheckedChange={(include_signature) =>
                setSettings({ ...settings, include_signature })
              }
            />
          </div>
          {settings.include_signature && (
            <div className="space-y-2">
              <Label htmlFor="signature">Texte de signature</Label>
              <Input
                id="signature"
                value={settings.signature}
                onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                placeholder="L'équipe {business_name}"
              />
              <p className="text-xs text-muted-foreground">
                Utilisez {"{business_name}"} pour insérer le nom de votre établissement
              </p>
            </div>
          )}
        </div>

        {/* Auto-reply settings */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Paramètres de réponse automatique</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delay">Délai avant réponse (minutes)</Label>
            <Input
              id="delay"
              type="number"
              min={0}
              max={60}
              value={settings.auto_reply_delay}
              onChange={(e) =>
                setSettings({ ...settings, auto_reply_delay: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Répondre uniquement aux avis positifs</h4>
              <p className="text-sm text-muted-foreground">
                Ne pas répondre automatiquement aux avis négatifs
              </p>
            </div>
            <Switch
              checked={settings.only_positive_reviews}
              onCheckedChange={(only_positive_reviews) =>
                setSettings({ ...settings, only_positive_reviews })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              <Label>Note minimum pour réponse automatique</Label>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSettings({ ...settings, minimum_rating: rating })}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                    settings.minimum_rating === rating
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto Sync Settings */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Synchronisation automatique</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Synchroniser les avis automatiquement</h4>
              <p className="text-sm text-muted-foreground">
                Les nouveaux avis seront importés périodiquement depuis Google
              </p>
            </div>
            <Switch
              checked={settings.auto_sync_reviews}
              onCheckedChange={(auto_sync_reviews) =>
                setSettings({ ...settings, auto_sync_reviews })
              }
            />
          </div>

          {settings.auto_sync_reviews && (
            <div className="space-y-2">
              <Label htmlFor="sync_interval">Intervalle de synchronisation (minutes)</Label>
              <div className="flex gap-2">
                {[15, 30, 60, 120].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setSettings({ ...settings, sync_interval_minutes: interval })}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      settings.sync_interval_minutes === interval
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {interval < 60 ? `${interval}min` : `${interval / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Auto Publish to Google */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Publication automatique sur Google</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Publier automatiquement les réponses IA</h4>
              <p className="text-sm text-muted-foreground">
                Les réponses générées par l'IA seront publiées directement sur Google Business Profile
              </p>
            </div>
            <Switch
              checked={settings.auto_publish_to_google}
              onCheckedChange={(auto_publish_to_google) =>
                setSettings({ ...settings, auto_publish_to_google })
              }
            />
          </div>

          {settings.auto_publish_to_google && (
            <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Attention</h4>
                  <p className="text-sm text-muted-foreground">
                    Les réponses seront publiées automatiquement après le délai configuré ({settings.auto_reply_delay} min). 
                    Assurez-vous que vos paramètres de ton et de contenu sont correctement configurés.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom template */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Template personnalisé (optionnel)</h3>
          </div>
          <Textarea
            value={settings.custom_template}
            onChange={(e) => setSettings({ ...settings, custom_template: e.target.value })}
            placeholder="Ajoutez des instructions personnalisées pour l'IA..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Ces instructions seront ajoutées au prompt de l'IA pour personnaliser les réponses
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Sauvegarder les paramètres
          </Button>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AISettingsPage;
