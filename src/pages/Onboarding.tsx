import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Check, ArrowRight, Building2, MessageCircle, Crown, Loader2, Star, AlertTriangle } from "lucide-react";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { BrandSparkle } from "@/components/BrandSparkle";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "@/i18n/config";

const STEPS = ["Welcome", "Choose location", "AI tone", "Pick a plan"];

const PLANS = [
  {
    keyMonthly: "ranki_starter_monthly",
    keyYearly: "ranki_starter_yearly",
    name: "Starter",
    monthly: "9,99€",
    yearly: "95,90€",
    desc: "Réponses IA aux avis Google · 1 établissement · 7j gratuits",
  },
  {
    keyMonthly: "ranki_pro_monthly",
    keyYearly: "ranki_pro_yearly",
    name: "Pro",
    monthly: "49€",
    yearly: "470€",
    desc: "Avis + SEO & GEO auto · 3 établissements · 7j gratuits",
    highlight: true,
  },
  {
    keyMonthly: "ranki_business_monthly",
    keyYearly: "ranki_business_yearly",
    name: "Business",
    monthly: "99€",
    yearly: "950,40€",
    desc: "Tout illimité · multi-établissements · 7j gratuits",
  },
];

const TONES = [
  { value: "friendly", label: "Friendly", desc: "Warm, casual, personable" },
  { value: "professional", label: "Professional", desc: "Polished, formal, on-brand" },
  { value: "concise", label: "Concise", desc: "Short and to the point" },
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { initiateOAuth } = useGoogleOAuth();
  const { i18n } = useTranslation();
  const isFrench = normalizeLanguage(i18n.resolvedLanguage || i18n.language) === "fr";
  const labels = isFrench ? ["Bienvenue", "Choisir une fiche", "Réponses IA", "Choisir un forfait"] : STEPS;
  const [syncError, setSyncError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [locationSelectionOpen, setLocationSelectionOpen] = useState(false);
  const [discoveredLocations, setDiscoveredLocations] = useState<{name: string; google_place_id: string; address: string | null; phone: string | null; website: string | null}[]>([]);
  const [locationLimit, setLocationLimit] = useState(1);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [tone, setTone] = useState("friendly");
  const [signature, setSignature] = useState("");
  const [planLoading, setPlanLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const purgeAndSignOut = async () => {
    try {
      await supabase.functions.invoke("purge-account-no-gmb");
    } catch (error) {
      console.warn("[Onboarding] account purge failed:", error);
    } finally {
      await supabase.auth.signOut();
      navigate("/auth?gmb_required=1", { replace: true });
    }
  };

  const loadBusinesses = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id, name").eq("user_id", user.id);
    setBusinesses(biz || []);
    if (biz && biz.length > 0 && !selectedBusinessId) setSelectedBusinessId(biz[0].id);
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    (async () => {
      const [{ data: profile }, { data: biz }] = await Promise.all([
        supabase.from("profiles").select("google_refresh_token, full_name, onboarding_completed").eq("id", user.id).maybeSingle(),
        supabase.from("businesses").select("id, name").eq("user_id", user.id),
      ]);
      // Only redirect completed users after confirming a GMB location exists.
      // A Google account without GMB must be purged and asked to choose another account.
      if (profile?.onboarding_completed && biz && biz.length > 0) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setHasGoogle(!!profile?.google_refresh_token);
      setSignature(profile?.full_name ? `The ${profile.full_name} team` : "The team");
      setBusinesses(biz || []);
      if (biz && biz.length > 0) setSelectedBusinessId(biz[0].id);

      // If Google is connected but no businesses yet, trigger sync
      if (profile?.google_refresh_token && (!biz || biz.length === 0)) {
        try {
          await supabase.functions.invoke("sync-google-businesses", { body: { user_id: user.id } });
          const { data: fresh } = await supabase.from("businesses").select("id, name").eq("user_id", user.id);
          setBusinesses(fresh || []);
          if (fresh && fresh.length > 0) {
            setSelectedBusinessId((prev) => prev || fresh[0].id);
            setNoGmbAccount(false);
          } else {
            // Google account has no Google Business Profile:
            // remove the account entirely and send the user back to sign-in
            setNoGmbAccount(true);
            await purgeAndSignOut();
          }

        } catch (e) {
          console.warn("[Onboarding] sync-google-businesses failed:", e);
          // Treat a failed/empty GMB sync as a blocked account, never continue onboarding.
          setNoGmbAccount(true);
          await purgeAndSignOut();
          return;
        }
      }
    })();
  }, [user, navigate]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleConnectGoogle = async () => {
    setLoading(true);
    try {
      // Remember to come back to onboarding after the Google round-trip
      sessionStorage.setItem("google_oauth_return_to", "/onboarding");
      await initiateOAuth();
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de démarrer la connexion Google", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleSaveAI = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("ai_settings")
      .upsert({ user_id: user.id, tone, signature, enabled: true } as any, { onConflict: "user_id" });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    next();
  };

  const handleChoosePlan = async (priceKey: string) => {
    if (!user || !priceKey) return;
    setPlanLoading(priceKey);
    try {
      await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("id", user.id);
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Lien de paiement indisponible");
      }
    } catch (e: unknown) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Paiement échoué", variant: "destructive" });
      setPlanLoading(null);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{isFrench ? "Étape" : "Step"} {step + 1} {isFrench ? "sur" : "of"} {STEPS.length}</span>
            <span>{labels[step]}</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        <Card className="rounded-2xl border-border/60 shadow-xl">
          <CardContent className="p-8 space-y-6">
            {step === 0 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BrandSparkle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{isFrench ? "Bienvenue sur Reviews AI 👋" : "Welcome to Reviews AI 👋"}</h2>
                <p className="text-muted-foreground">
                  {isFrench ? "Vous êtes déjà connecté avec Google. Choisissez votre fiche, personnalisez les réponses IA et choisissez un forfait." : "You are already signed in with Google. Choose your business, set up AI replies, and pick a plan."}
                </p>
                <Button size="lg" onClick={next} className="rounded-xl">
                  {isFrench ? "Commencer" : "Get started"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isFrench ? "Choisissez votre établissement principal" : "Choose your main location"}</h2>
                    <p className="text-sm text-muted-foreground">{isFrench ? "Vous pourrez en ajouter plus tard." : "You can add more later."}</p>
                  </div>
                </div>

                {businesses.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                    <div className="flex gap-2 text-sm items-start">
                      {discovering ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />}
                      <div>
                        <p className="font-semibold">{discovering ? (isFrench ? "Recherche des fiches Google…" : "Finding Google locations…") : (isFrench ? "Aucune fiche disponible" : "No locations available")}</p>
                        {syncError && <p role="alert" className="mt-1 text-muted-foreground break-words">{syncError}</p>}
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="w-full"
                      disabled={discovering || !hasGoogle} onClick={() => void discoverGoogleLocations()}>
                      {isFrench ? "Rechercher mes fiches" : "Find my Google locations"}
                    </Button>
                    {needsReconnect && <Button type="button" variant="ghost" className="w-full" disabled={loading || discovering}
                      onClick={handleConnectGoogle}>{isFrench ? "Renouveler l'autorisation Google" : "Renew Google permission"}</Button>}
                  </div>
                ) : (
                  <RadioGroup value={selectedBusinessId} onValueChange={setSelectedBusinessId} className="space-y-2">
                    {businesses.map((b) => (
                      <Label
                        key={b.id}
                        htmlFor={b.id}
                        className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/40 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem id={b.id} value={b.id} />
                        <span className="font-semibold">{b.name}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={back}>{isFrench ? "Retour" : "Back"}</Button>
                  <Button onClick={handleContinueLocation} disabled={!selectedBusinessId || discovering}>{isFrench ? "Continuer" : "Continue"} <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Set your AI tone</h2>
                    <p className="text-sm text-muted-foreground">How should Reviews AI reply to reviews?</p>
                  </div>
                </div>

                <RadioGroup value={tone} onValueChange={setTone} className="space-y-2">
                  {TONES.map((t) => (
                    <Label
                      key={t.value}
                      htmlFor={t.value}
                      className="flex items-start gap-3 p-4 rounded-xl border-2 border-border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={t.value} value={t.value} className="mt-0.5" />
                      <div>
                        <div className="font-semibold">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="sig">Reply signature</Label>
                  <Input id="sig" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="The team" />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={back}>Retour</Button>
                  <Button onClick={handleSaveAI} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & continue <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Crown className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Choisissez votre plan</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paiement sécurisé. Résiliable à tout moment.
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="inline-flex items-center p-1 rounded-full bg-muted border border-border">
                    <button
                      type="button"
                      onClick={() => setBilling("monthly")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        billing === "monthly" ? "bg-foreground text-background" : "text-muted-foreground"
                      }`}
                    >
                      Mensuel
                    </button>
                    <button
                      type="button"
                      onClick={() => setBilling("yearly")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                        billing === "yearly" ? "bg-foreground text-background" : "text-muted-foreground"
                      }`}
                    >
                      Annuel
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">-20%</span>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {PLANS.map((p) => {
                    const key = billing === "yearly" ? p.keyYearly : p.keyMonthly;
                    const price = billing === "yearly" ? p.yearly : p.monthly;
                    const period = billing === "yearly" ? "/an" : "/mois";
                    return (
                      <button
                        key={p.name}
                        onClick={() => handleChoosePlan(key)}
                        disabled={planLoading !== null}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          p.highlight
                            ? "border-primary bg-primary/5 hover:bg-primary/10"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="font-bold">{p.name}</div>
                        <div className="text-2xl font-extrabold mt-1">{price}<span className="text-xs font-normal text-muted-foreground">{period}</span></div>
                        <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                        {planLoading === key && (
                          <Loader2 className="w-4 h-4 animate-spin mt-2 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-start items-center pt-2">
                  <Button variant="ghost" onClick={back}>Retour</Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
      {user && <SelectBusinessesDialog
        open={locationSelectionOpen}
        onOpenChange={setLocationSelectionOpen}
        businesses={discoveredLocations}
        maxBusinesses={locationLimit}
        userId={user.id}
        onSuccess={() => { void loadBusinesses(); setSyncError(null); }}
      />}
    </div>
  );
};

export default Onboarding;