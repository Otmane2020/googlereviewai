import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, MessageCircle, Crown, Loader2, Star, AlertTriangle, Building2 } from "lucide-react";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { BrandSparkle } from "@/components/BrandSparkle";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "@/i18n/config";
import { isActivePaidPlan } from "@/lib/planEntitlements";
import {
  shortReviewBrandName, resolveReviewSignature, detectReviewSignatureChoice,
  buildReviewSignatureChoice, type ReviewSignatureMode,
} from "../../supabase/functions/_shared/review-signature";

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
  const [discoveredLocations, setDiscoveredLocations] = useState<{name: string; google_place_id: string; address: string | null; phone: string | null; website: string | null; profile_image_url?: string | null}[]>([]);
  const [locationLimit, setLocationLimit] = useState(1);
  const [step, setStep] = useState(0);
  const [freeLoading, setFreeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [tone, setTone] = useState("friendly");
  const [signatureMode, setSignatureMode] = useState<ReviewSignatureMode>("automatic");
  const [signatureName, setSignatureName] = useState("");
  const [customSignature, setCustomSignature] = useState("");
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
        // Google has returned real locations: it IS connected. A pending
        // location selection is not a connection failure.
        setHasGoogle(true);
        setSyncError(null);
        setNeedsReconnect(false);
        // The current Edge Function can lag behind the frontend deployment.
        // Fall back to previously imported official Google cover photos without
        // requiring another Google OAuth flow or leaking photos across users.
        const { data: savedPhotos } = await supabase.from("businesses")
          .select("google_place_id,profile_image_url").eq("user_id", user.id);
        const photoByLocation = new Map(
          (savedPhotos || []).filter(b => b.google_place_id && b.profile_image_url)
            .map(b => [b.google_place_id, b.profile_image_url]),
        );
        setDiscoveredLocations(data.google_businesses.map((business: typeof discoveredLocations[number]) => ({
          ...business,
          profile_image_url: business.profile_image_url
            || photoByLocation.get(business.google_place_id) || null,
        })));
        setLocationLimit(data.max_businesses || 1);
        if (step === 1) setLocationSelectionOpen(true);
        return;
      }
      setHasGoogle(true);
      setSyncError(null);
      setNeedsReconnect(false);
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
      const [{ data: profile }, { data: biz }, { data: aiSettings }] = await Promise.all([
        supabase.from("profiles").select("google_refresh_token,full_name,onboarding_completed,free_plan_selected_at,plan_name,subscription_status,current_period_end,trial_end")
          .eq("id", user.id).maybeSingle(),
        supabase.from("businesses").select("id,name,is_active").eq("user_id", user.id),
        supabase.from("ai_settings").select("user_id,signature,tone,include_signature").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      const managed = (biz || []).filter(b => b.is_active);
      // A checkout attempt is NOT a completed onboarding. Legacy accounts may
      // have onboarding_completed=true from an abandoned Stripe checkout.
      const paid = isActivePaidPlan(profile);
      const explicitFree = Boolean(profile?.onboarding_completed && profile?.free_plan_selected_at);
      if ((paid || explicitFree) && managed.length > 0) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Rehydrate the last valid wizard step after refresh or a cancelled payment.
      // Prefer an explicit last-step request for the Stripe cancellation return.
      const savedStep = Number(localStorage.getItem("reviewsai_onboarding_step_" + user.id) || "0");
      const returningFromCheckout = new URLSearchParams(window.location.search).get("step") === "plan";
      if (managed.length > 0) {
        if (returningFromCheckout || profile?.onboarding_completed || savedStep >= 3 || Boolean(aiSettings?.user_id)) {
          setStep(3);
        } else if (savedStep >= 2) {
          setStep(2);
        } else if (savedStep >= 1) {
          setStep(1);
        }
      } else if (savedStep >= 1) {
        setStep(1);
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
      // Restore explicit signature choices while migrating old onboarding
      // defaults that mistakenly signed with the account owner's personal name.
      const storedChoice = detectReviewSignatureChoice(
        aiSettings?.signature, aiSettings?.include_signature, profile?.full_name,
      );
      setSignatureMode(storedChoice.mode);
      setSignatureName(storedChoice.name);
      setCustomSignature(storedChoice.custom);
      if (aiSettings?.tone) setTone(aiSettings.tone);
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

  const saveStep = (nextStep: number) => {
    setStep(nextStep);
    if (user) localStorage.setItem("reviewsai_onboarding_step_" + user.id, String(nextStep));
  };
  const next = () => saveStep(Math.min(step + 1, STEPS.length - 1));
  const back = () => saveStep(Math.max(step - 1, 0));

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
    if (!user || loading) return;
    let savedSignature: { signature: string; include_signature: boolean };
    try {
      savedSignature = buildReviewSignatureChoice(
        { mode: signatureMode, name: signatureName, custom: customSignature },
        isFrench ? "fr" : "en",
      );
    } catch {
      toast({
        title: isFrench ? "Signature incomplète" : "Incomplete signature",
        description: isFrench ? "Renseignez le nom ou le texte de signature choisi." : "Enter your selected signature name or text.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("ai_settings")
        .upsert({
          user_id: user.id,
          tone,
          signature: savedSignature.signature,
          include_signature: savedSignature.include_signature,
          enabled: true,
        } as any, { onConflict: "user_id" });
      if (error) throw error;
      next();
    } catch (error) {
      toast({
        title: isFrench ? "Erreur" : "Error",
        description: error instanceof Error ? error.message : (isFrench ? "Impossible d'enregistrer les préférences" : "Unable to save your preferences"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePlan = async (priceKey: string) => {
    if (!user || !priceKey) return;
    setPlanLoading(priceKey);
    try {
      // Never complete onboarding until Stripe confirms an active subscription.
      localStorage.setItem("reviewsai_onboarding_step_" + user.id, "3");
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          successUrl: `${window.location.origin}/payment-success?source=onboarding`,
          cancelUrl: `${window.location.origin}/onboarding?step=plan`,
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

  const handleContinueFree = async () => {
    if (!user || freeLoading || planLoading) return;
    setFreeLoading(true);
    try {
      // This only records an explicit choice. The original welcome grant is
      // lifetime-only and must never be reissued or reset by this action.
      const { data, error } = await supabase.from("profiles")
        .update({
          free_plan_selected_at: new Date().toISOString(),
          onboarding_completed: true,
        })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (error || !data) throw new Error(error?.message || "Unable to save free plan");
      localStorage.removeItem("reviewsai_onboarding_step_" + user.id);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast({
        title: isFrench ? "Erreur" : "Error",
        description: error instanceof Error ? error.message : (isFrench ? "Impossible d'activer l'accès gratuit" : "Could not activate free access"),
        variant: "destructive",
      });
    } finally {
      setFreeLoading(false);
    }
  };

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId) || businesses[0];
  const smartBusinessName = shortReviewBrandName(selectedBusiness?.name);
  const signatureChoice = { mode: signatureMode, name: signatureName, custom: customSignature };
  const signaturePreview = (() => {
    try {
      const chosen = buildReviewSignatureChoice(signatureChoice, isFrench ? "fr" : "en");
      return resolveReviewSignature({
        businessName: selectedBusiness?.name,
        language: isFrench ? "fr" : "en",
        configuredSignature: chosen.signature,
        includeSignature: chosen.include_signature,
      });
    } catch {
      return "";
    }
  })();

  return (
    <div className="min-h-screen reviewai-wizard-bg flex items-start justify-center px-3 py-5 sm:px-6 sm:py-10">
      <div className="w-full max-w-[740px] space-y-5 sm:space-y-7">
        <header className="reviewai-surface px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
          <RankiLogo className="text-foreground" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {isFrench ? "Configuration du compte" : "Account setup"}
            </span>
            <LanguageSwitcher variant="dropdown" />
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
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isFrench ? "Choisissez votre établissement principal" : "Choose your main location"}</h2>
                    <p className="text-sm text-muted-foreground">{isFrench ? "Vous pourrez en ajouter plus tard." : "You can add more later."}</p>
                  </div>
                </div>

                {businesses.length === 0 && discoveredLocations.length > 0 && (
                  <div className="reviewai-soft-card p-4 sm:p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-semibold text-sm text-foreground">
                          {isFrench ? "Vos fiches Google sont disponibles" : "Your Google locations are available"}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {isFrench
                            ? `${discoveredLocations.length} établissements trouvés. Votre connexion Google fonctionne. Choisissez ceux que vous souhaitez gérer selon votre forfait.`
                            : `${discoveredLocations.length} locations found. Google is connected. Choose the locations to manage within your plan.`}
                        </p>
                      </div>
                    </div>
                    <Button type="button" className="w-full rounded-xl" onClick={() => setLocationSelectionOpen(true)}>
                      {isFrench ? "Sélectionner mes établissements" : "Select my locations"}
                    </Button>
                  </div>
                )}
                {businesses.length === 0 && discoveredLocations.length === 0 && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                    <div className="flex gap-2 text-sm items-start">
                      {discovering ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />}
                      <div>
                        <p className="font-semibold">{discovering
                          ? (isFrench ? "Recherche des fiches Google…" : "Finding Google locations…")
                          : (isFrench ? "Aucune fiche disponible" : "No locations available")}</p>
                        {syncError && <p role="alert" className="mt-1 text-muted-foreground break-words">{syncError}</p>}
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="w-full"
                      disabled={discovering || !hasGoogle} onClick={() => void discoverGoogleLocations()}>
                      {isFrench ? "Rechercher mes fiches" : "Find my Google locations"}
                    </Button>
                    {needsReconnect && (
                      <Button type="button" variant="ghost" className="w-full"
                        disabled={loading || discovering} onClick={handleConnectGoogle}>
                        {isFrench ? "Renouveler l’autorisation Google" : "Renew Google permission"}
                      </Button>
                    )}
                  </div>
                )}
                {businesses.length > 0 && (
                  <RadioGroup value={selectedBusinessId} onValueChange={setSelectedBusinessId} className="space-y-2">
                    {businesses.map(b => (
                      <Label key={b.id} htmlFor={b.id}
                        className="reviewai-soft-card flex items-center gap-3 p-4 hover:border-primary/40 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem id={b.id} value={b.id} />
                        <span className="font-semibold">{b.name}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                <div className="flex justify-between items-center gap-3 border-t border-border/60 pt-5 mt-5">
                  <Button variant="ghost" onClick={back}>{isFrench ? "Retour" : "Back"}</Button>
                  <Button className="rounded-xl reviewai-brand-gradient h-11 px-6" onClick={handleContinueLocation} disabled={!selectedBusinessId || discovering}>{isFrench ? "Continuer" : "Continue"} <ArrowRight className="w-4 h-4 ml-2" /></Button>
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
                      className="reviewai-soft-card flex items-start gap-3 p-4 hover:border-primary/40 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={t.value} value={t.value} className="mt-0.5" />
                      <div>
                        <div className="font-semibold">{isFrench ? ({friendly: "Chaleureux", professional: "Professionnel", concise: "Concis"} as Record<string,string>)[t.value] : t.label}</div>
                        <div className="text-xs text-muted-foreground">{isFrench ? ({friendly: "Accueillant, naturel et sympathique", professional: "Formel, soigné et fidèle à votre marque", concise: "Court et direct"} as Record<string,string>)[t.value] : t.desc}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>

                <div className="space-y-3 border-t border-border/60 pt-5">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{isFrench ? "Qui signe vos réponses ?" : "Who signs your replies?"}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {isFrench
                        ? "Le nom de l'établissement est détecté et raccourci automatiquement. Vous pouvez le modifier."
                        : "Your business name is automatically detected and shortened. You can change it."}
                    </p>
                    {selectedBusiness?.name && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {isFrench ? "Fiche Google :" : "Google listing:"} <span className="font-medium text-foreground">{selectedBusiness.name}</span>
                        {smartBusinessName && smartBusinessName !== selectedBusiness.name && (
                          <> <span aria-hidden="true">→</span> <span className="font-semibold text-primary">{smartBusinessName}</span></>
                        )}
                      </p>
                    )}
                  </div>

                  <RadioGroup value={signatureMode} onValueChange={(v) => setSignatureMode(v as ReviewSignatureMode)} className="space-y-2">
                    <Label htmlFor="signature-automatic" className="reviewai-soft-card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem id="signature-automatic" value="automatic" className="mt-1" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {isFrench ? "L'équipe + nom intelligent" : "Team + smart business name"}
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{isFrench ? "Recommandé" : "Recommended"}</span>
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {isFrench ? "Ex. : " : "E.g. "}{isFrench ? "L'équipe " + (smartBusinessName || "Votre entreprise") : "The " + (smartBusinessName || "business") + " team"}
                        </span>
                      </span>
                    </Label>

                    <Label htmlFor="signature-business-only" className="reviewai-soft-card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem id="signature-business-only" value="business_only" className="mt-1" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{isFrench ? "Nom de la marque uniquement" : "Business name only"}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{smartBusinessName || (isFrench ? "Nom de votre marque" : "Your brand name")}</span>
                      </span>
                    </Label>

                    <Label htmlFor="signature-named-team" className="reviewai-soft-card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem id="signature-named-team" value="named_team" className="mt-1" />
                      <span className="block text-sm font-semibold">{isFrench ? "Choisir un autre nom" : "Choose a different name"}</span>
                    </Label>
                    {signatureMode === "named_team" && (
                      <div className="pl-1 sm:pl-8 space-y-1.5">
                        <Label htmlFor="signature-name" className="text-xs">{isFrench ? "Nom à afficher" : "Display name"}</Label>
                        <Input id="signature-name" className="h-11 rounded-xl bg-background" maxLength={80}
                          value={signatureName} onChange={e => setSignatureName(e.target.value)}
                          placeholder={smartBusinessName || (isFrench ? "Nom de votre enseigne" : "Your business name")} />
                        <p className="text-xs text-muted-foreground">
                          {isFrench ? "Ce nom sera utilisé pour les réponses de tous vos établissements." : "This name will be used for replies across all your locations."}
                        </p>
                      </div>
                    )}

                    <Label htmlFor="signature-custom" className="reviewai-soft-card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem id="signature-custom" value="custom" className="mt-1" />
                      <span className="block text-sm font-semibold">{isFrench ? "Écrire ma propre signature" : "Write my own signature"}</span>
                    </Label>
                    {signatureMode === "custom" && (
                      <div className="pl-1 sm:pl-8 space-y-1.5">
                        <Label htmlFor="signature-custom-text" className="text-xs">{isFrench ? "Signature personnalisée" : "Custom sign-off"}</Label>
                        <Input id="signature-custom-text" className="h-11 rounded-xl bg-background" maxLength={180}
                          value={customSignature} onChange={e => setCustomSignature(e.target.value)}
                          placeholder={isFrench ? "À bientôt, l'équipe de la boutique" : "Warm regards, our team"} />
                      </div>
                    )}

                    <Label htmlFor="signature-none" className="reviewai-soft-card flex cursor-pointer items-start gap-3 p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem id="signature-none" value="none" className="mt-1" />
                      <span className="block text-sm font-semibold">{isFrench ? "Sans signature" : "No signature"}</span>
                    </Label>
                  </RadioGroup>

                  <div aria-live="polite" className="rounded-2xl border border-primary/15 bg-primary/[0.045] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{isFrench ? "Aperçu de la signature" : "Signature preview"}</p>
                    <p className="mt-2 break-words text-sm font-semibold text-foreground">
                      {signaturePreview || (signatureMode === "none"
                        ? (isFrench ? "Aucune signature ne sera ajoutée." : "No sign-off will be added.")
                        : (isFrench ? "Saisissez votre nom pour voir l'aperçu." : "Enter your name to see the preview."))}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 border-t border-border/60 pt-5 mt-5">
                  <Button variant="ghost" onClick={back}>{isFrench ? "Retour" : "Back"}</Button>
                  <Button className="rounded-xl reviewai-brand-gradient h-11 px-6" onClick={handleSaveAI} disabled={loading}>
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
                  <div className="inline-flex items-center p-1 rounded-2xl bg-muted/70 border border-border/70">
                    <button
                      type="button"
                      onClick={() => setBilling("monthly")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        billing === "monthly" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      {isFrench ? "Mensuel" : "Monthly"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBilling("yearly")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                        billing === "yearly" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
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
                        className={`relative text-left p-4 sm:p-5 rounded-[20px] border transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
                          p.highlight
                            ? "border-primary/50 bg-primary/5 shadow-[0_8px_25px_rgba(59,84,245,0.08)] hover:bg-primary/10"
                            : "border-border/80 bg-card hover:border-primary/40 hover:shadow-sm"
                        }`}
                      >
                        {p.highlight && <span className="inline-flex mb-2 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-1">
                           {isFrench ? "Le plus choisi" : "Most popular"}
                         </span>}
                         <div className="font-bold">{p.name}</div>
                        <div className="text-2xl font-extrabold mt-2 tracking-tight">{price}<span className="text-xs font-normal text-muted-foreground">{period}</span></div>
                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                        {planLoading === key && (
                          <Loader2 className="w-4 h-4 animate-spin mt-2 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="reviewai-soft-card rounded-2xl p-4 sm:p-5 text-center space-y-3 border border-primary/15 bg-primary/[0.03]">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">
                      {isFrench ? "Vous préférez essayer gratuitement ?" : "Prefer to try for free?"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {isFrench
                        ? "3 crédits IA offerts une seule fois. Sans carte bancaire ni abonnement."
                        : "3 complimentary AI credits, once per account. No card or subscription required."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto min-h-11 rounded-xl border-primary/35 font-semibold"
                    onClick={handleContinueFree}
                    disabled={freeLoading || planLoading !== null}
                  >
                    {freeLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isFrench ? "Continuer sans forfait — 3 crédits gratuits" : "Continue without a plan — 3 free credits"}
                    {!freeLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>

                <div className="flex justify-start items-center border-t border-border/60 pt-5">
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
        onSuccess={() => {
          setSyncError(null);
          setNeedsReconnect(false);
          void loadBusinesses()
            .then(() => setDiscoveredLocations([]))
            .catch(e => setSyncError(e instanceof Error ? e.message : String(e)));
        }}
      />}
    </div>
  );
};

export default Onboarding;