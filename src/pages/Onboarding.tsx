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
import { ArrowRight, MessageCircle, Crown, Loader2, Star, AlertTriangle } from "lucide-react";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { BrandSparkle } from "@/components/BrandSparkle";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
    desc: "Réponses IA aux avis Google · 1 établissement ",
  },
  {
    keyMonthly: "ranki_pro_monthly",
    keyYearly: "ranki_pro_yearly",
    name: "Pro",
    monthly: "49€",
    yearly: "470€",
    desc: "Avis + SEO & GEO auto · 3 établissements",
    highlight: true,
  },
  {
    keyMonthly: "ranki_business_monthly",
    keyYearly: "ranki_business_yearly",
    name: "Business",
    monthly: "99€",
    yearly: "950,40€",
    desc: "Tout illimité · multi-établissements",
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

  const loadBusinesses = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("businesses")
      .select("id,name").eq("user_id", user.id).eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);
    const saved = localStorage.getItem("googlereviewai.com_selected_business_" + user.id);
    const active = data || [];
    setBusinesses(active);
    setSelectedBusinessId(prev => active.find(b => b.id === prev)?.id
      || active.find(b => b.id === saved)?.id || active[0]?.id || "");
  };

  const discoverGoogleLocations = async () => {
    if (!user) return;
    setDiscovering(true);
    setSyncError(null);
    setNeedsReconnect(false);
    try {
      // The initial Google sign-in requests business.manage AND offline access.
      // Reuse the saved provider refresh token instead of forcing another OAuth.
      const { data, error } = await supabase.functions.invoke("sync-google-businesses", { body: {} });
      if (error) {
        let message = error.message;
        try {
          const details = await error.context?.clone?.().json?.();
          message = details?.message || details?.error || message;
        } catch {}
        throw new Error(message);
      }
      if (!data?.success) {
        setNeedsReconnect(Boolean(data?.requires_reconnect));
        throw new Error(data?.message || data?.error || "Google Business sync failed");
      }
      if (data.requires_selection && data.google_businesses?.length) {
        setDiscoveredLocations(data.google_businesses);
        setLocationLimit(data.max_businesses || 1);
        if (step === 1) setLocationSelectionOpen(true);
        return;
      }
      await loadBusinesses();
      if (data.businesses?.length === 0) {
        setSyncError(isFrench
          ? "Google n'a trouvé aucune fiche accessible. Vérifiez le compte propriétaire de votre fiche dans Google Business Profile. Votre compte Reviews AI reste conservé."
          : "Google found no accessible locations. Check the Google account that manages your Business Profile. Your Reviews AI account is kept.");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Google sync failed";
      setSyncError(message);
      // A temporary Google API error must NEVER delete a legitimate user account.
      console.warn("[Onboarding] Google discovery error:", message);
    } finally {
      setDiscovering(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    let active = true;
    (async () => {
      const [{ data: profile }, { data: biz }] = await Promise.all([
        supabase.from("profiles").select("google_refresh_token,full_name,onboarding_completed")
          .eq("id", user.id).maybeSingle(),
        supabase.from("businesses").select("id,name,is_active").eq("user_id", user.id),
      ]);
      if (!active) return;
      const managed = (biz || []).filter(b => b.is_active);
      if (profile?.onboarding_completed && managed.length > 0) {
        navigate("/dashboard", { replace: true });
        return;
      }
      let authorized = Boolean(profile?.google_refresh_token);
      if (!authorized) {
        // The initial sign-in may carry the provider refresh token even when
        // /auth has not yet persisted it. Save it before offering another OAuth.
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id === user.id && session.provider_refresh_token) {
          const { error: tokenError } = await supabase.from("profiles").update({
            google_refresh_token: session.provider_refresh_token,
            google_access_token: null,
            google_token_expires_at: null,
          }).eq("id", user.id);
          authorized = !tokenError;
        }
      }
      if (!active) return;
      setHasGoogle(authorized);
      setSignature(profile?.full_name
        ? (isFrench ? "L'équipe " + profile.full_name : "The " + profile.full_name + " team")
        : (isFrench ? "L'équipe" : "The team"));
      setBusinesses(managed);
      const remembered = localStorage.getItem("googlereviewai.com_selected_business_" + user.id);
      setSelectedBusinessId(managed.find(b => b.id === remembered)?.id || managed[0]?.id || "");
      if (!managed.length && authorized) await discoverGoogleLocations();
      if (!managed.length && !authorized) {
        setNeedsReconnect(true);
        setSyncError(isFrench
          ? "L'autorisation Google Business n'a pas été enregistrée lors de la connexion. Renouvelez-la uniquement si nécessaire."
          : "Google Business authorization was not saved during sign-in. Renew permission only if needed.");
      }
    })();
    return () => { active = false; };
  }, [user?.id, navigate]);

  useEffect(() => {
    if (step === 1 && discoveredLocations.length > 0 && businesses.length === 0) {
      setLocationSelectionOpen(true);
    }
  }, [step, discoveredLocations.length, businesses.length]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleConnectGoogle = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem("google_oauth_return_to", "/onboarding");
      await initiateOAuth();
    } catch (e) {
      toast({
        title: isFrench ? "Erreur" : "Error",
        description: isFrench ? "Impossible de renouveler l'accès Google Business." : "Could not renew Google Business access.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLocation = () => {
    if (!user || !selectedBusinessId) return;
    localStorage.setItem("googlereviewai.com_selected_business_" + user.id, selectedBusinessId);
    next();
  };

  const handleSaveAI = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("ai_settings")
      .upsert({ user_id: user.id, tone, signature, enabled: true } as any, { onConflict: "user_id" });
    setLoading(false);
    if (error) {
      toast({ title: isFrench ? "Erreur" : "Error", description: error.message, variant: "destructive" });
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
      toast({ title: isFrench ? "Erreur" : "Error", description: e instanceof Error ? e.message : (isFrench ? "Paiement échoué" : "Payment failed"), variant: "destructive" });
      setPlanLoading(null);
    }
  };


  return (
    <div className="min-h-screen reviewai-wizard-bg flex items-start justify-center px-3 py-5 sm:px-6 sm:py-10">
      <div className="w-full max-w-[740px] space-y-5 sm:space-y-7">
        <header className="reviewai-surface px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
          <RankiLogo className="text-foreground" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {isFrench ? "Configuration du compte" : "Account setup"}
            </span>
            <LanguageSwitcher variant="flags" />
          </div>
        </header>
        <div className="reviewai-surface px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{isFrench ? "Étape" : "Step"} {step + 1} {isFrench ? "sur" : "of"} {STEPS.length}</span>
            <span className="text-primary">{labels[step]}</span>
          </div>
          <div className="grid grid-cols-4 gap-2" aria-label={isFrench ? "Progression de l'inscription" : "Signup progress"}>
            {labels.map((label, index) => (
              <div key={index} className="space-y-1.5 min-w-0">
                <div className={`h-1.5 rounded-full transition-colors ${index <= step ? "reviewai-brand-gradient" : "bg-muted"}`} />
                <span className={`hidden sm:block text-[10px] text-center truncate ${index === step ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden border-border/75 rounded-[24px] sm:rounded-[28px] shadow-[0_16px_50px_rgba(39,57,121,0.07)] bg-card">
          <div className="h-1 reviewai-brand-line" aria-hidden="true" />
          <CardContent className="p-5 sm:p-8 space-y-6">
            {step === 0 && (
              <div className="text-center space-y-5 py-3 sm:py-6">
                <div className="h-20 w-20 sm:h-24 sm:w-24 mx-auto rounded-[22px] bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <BrandSparkle className="w-14 h-14 sm:w-16 sm:h-16" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{isFrench ? "Bienvenue sur Reviews AI" : "Welcome to Reviews AI"}</h2>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-md mx-auto">
                  {isFrench ? "Votre compte Google est connecté. Choisissez un établissement, personnalisez vos réponses et démarrez avec le bon forfait." : "Your Google account is connected. Choose a location, personalize your replies and select your plan."}
                </p>
                <Button size="lg" onClick={next} className="w-full sm:w-auto px-9 h-12 rounded-xl reviewai-brand-gradient font-semibold shadow-md shadow-primary/15">
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
                    <h2 className="text-xl font-bold">{isFrench ? "Choisissez le ton des réponses IA" : "Set your AI tone"}</h2>
                    <p className="text-sm text-muted-foreground">{isFrench ? "Comment Reviews AI doit-il répondre aux avis ?" : "How should Reviews AI reply to reviews?"}</p>
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
                        <div className="font-semibold">{isFrench ? ({friendly: "Chaleureux", professional: "Professionnel", concise: "Concis"} as Record<string,string>)[t.value] : t.label}</div>
                        <div className="text-xs text-muted-foreground">{isFrench ? ({friendly: "Accueillant, naturel et sympathique", professional: "Formel, soigné et fidèle à votre marque", concise: "Court et direct"} as Record<string,string>)[t.value] : t.desc}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="sig">{isFrench ? "Signature des réponses" : "Reply signature"}</Label>
                  <Input id="sig" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={isFrench ? "L’équipe" : "The team"} />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={back}>{isFrench ? "Retour" : "Back"}</Button>
                  <Button onClick={handleSaveAI} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isFrench ? "Enregistrer et continuer" : "Save & continue"} <ArrowRight className="w-4 h-4 ml-2" /></>}
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
                  <h2 className="text-2xl font-bold">{isFrench ? "Choisissez votre forfait" : "Choose your plan"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isFrench ? "Paiement sécurisé. Résiliable à tout moment." : "Secure checkout. Cancel anytime."}
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
                      {isFrench ? "Mensuel" : "Monthly"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBilling("yearly")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                        billing === "yearly" ? "bg-foreground text-background" : "text-muted-foreground"
                      }`}
                    >
                      {isFrench ? "Annuel" : "Yearly"}
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">-20%</span>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {PLANS.map((p) => {
                    const euroKey = billing === "yearly" ? p.keyYearly : p.keyMonthly;
                    const key = isFrench ? euroKey : euroKey + "_usd";
                    const euroPrice = billing === "yearly" ? p.yearly : p.monthly;
                    const price = isFrench ? euroPrice : "$" + euroPrice.replace("€", "").replace(",", ".");
                    const period = billing === "yearly" ? (isFrench ? "/an" : "/year") : (isFrench ? "/mois" : "/month");
                    const description = isFrench ? p.desc : (p.name === "Starter"
                      ? "AI replies to Google reviews · 1 location"
                      : p.name === "Pro"
                        ? "Reviews + automated SEO & GEO · 3 locations"
                        : "Complete suite · multiple locations");
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
                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                        {planLoading === key && (
                          <Loader2 className="w-4 h-4 animate-spin mt-2 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-start items-center pt-2">
                  <Button variant="ghost" onClick={back}>{isFrench ? "Retour" : "Back"}</Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
        <p className="text-center text-[11px] text-muted-foreground px-4 pb-2">
          {isFrench ? "Reviews AI · Configuration sécurisée de votre espace" : "Reviews AI · Secure workspace setup"}
        </p>
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