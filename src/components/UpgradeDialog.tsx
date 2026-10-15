import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, ShieldCheck, Coins, Loader2, Check, RefreshCw, ArrowRight, ChevronDown, CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandSparkle } from "@/components/BrandSparkle";
import { effectivePlanTier, isActivePaidPlan, type PlanProfile } from "@/lib/planEntitlements";

interface CreditPack {
  price: number;
  credits: number;
  priceKey: string;
}

const creditPacks: CreditPack[] = [
  { price: 2.99, credits: 10, priceKey: "credits_10" },
  { price: 29, credits: 100, priceKey: "credits_100" },
  { price: 99, credits: 330, priceKey: "credits_330" },
  { price: 199, credits: 660, priceKey: "credits_660" },
  { price: 299, credits: 1000, priceKey: "credits_1000" },
  { price: 499, credits: 1660, priceKey: "credits_1660" },
  { price: 999, credits: 3330, priceKey: "credits_3330" },
  { price: 1999, credits: 6660, priceKey: "credits_6660" },
  { price: 2999, credits: 10000, priceKey: "credits_10000" },
];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  exhausted?: boolean;
  locked?: boolean;
  onRetry?: () => void;
  onSignOut?: () => void;
}

type Billing = "monthly" | "yearly";

type PlanCard = {
  id: "starter" | "pro" | "business";
  name: string;
  tagline: { fr: string; en: string };
  monthly: { price: string; key: string };
  yearly: { price: string; key: string };
  features: { fr: string[]; en: string[] };
  highlight?: boolean;
};

const PLANS: PlanCard[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: { fr: "Avis Google", en: "Google reviews" },
    monthly: { price: "9,99€", key: "ranki_starter_monthly" },
    yearly:  { price: "95,90€", key: "ranki_starter_yearly" },
    features: {
      fr: ["1 établissement", "Réponses IA 24/7 aux avis Google", "Alertes email & push", "Tableau de bord avis"],
      en: ["1 location", "24/7 AI replies to Google reviews", "Email & push alerts", "Reviews dashboard"],
    },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: { fr: "Avis + SEO & GEO automatiques", en: "Reviews + automated SEO & GEO" },
    monthly: { price: "49€", key: "ranki_pro_monthly" },
    yearly:  { price: "470€", key: "ranki_pro_yearly" },
    features: {
      fr: ["Jusqu'à 3 établissements", "Réponses IA illimitées", "GEO Rank quotidien", "Posts Google soumis à validation + FAQ GEO générées", "Support prioritaire"],
      en: ["Up to 3 locations", "Unlimited AI replies", "Daily GEO ranking", "Google posts subject to approval + generated GEO FAQs", "Priority support"],
    },
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    tagline: { fr: "Multi-établissements illimités", en: "Unlimited locations" },
    monthly: { price: "99€", key: "ranki_business_monthly" },
    yearly:  { price: "950,40€", key: "ranki_business_yearly" },
    features: {
      fr: ["Établissements illimités", "Création de posts & FAQ illimitée (diffusion Google sous réserve)", "API & webhooks", "Manager dédié", "Rapports personnalisés"],
      en: ["Unlimited locations", "Unlimited post & FAQ creation (Google moderation applies)", "API & webhooks", "Dedicated manager", "Custom reports"],
    },
  },
];

const normalizePlan = (plan?: string): "starter" | "pro" | "business" | null => {
  if (!plan) return null;
  const p = plan.toLowerCase();
  if (p.includes("business") || p.includes("agence") || p.includes("agency")) return "business";
  if (p.includes("pro") || p.includes("daily") || p.includes("quotidien") || p.includes("growth")) return "pro";
  if (p.includes("starter")) return "starter";
  return null;
};

export const UpgradeDialog = ({ open, onOpenChange, currentPlan, exhausted = false, locked = false, onRetry, onSignOut }: UpgradeDialogProps) => {
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [selectedPackKey, setSelectedPackKey] = useState("credits_100");
  const [showAllPacks, setShowAllPacks] = useState(false);

  const [liveProfile, setLiveProfile] = useState<PlanProfile | null>(null);
  const [checkingPlan, setCheckingPlan] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setCheckingPlan(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) { setLiveProfile(null); setCheckingPlan(false); }
        return;
      }
      const { data, error } = await supabase.from("profiles")
        .select("plan_name,plan_id,subscription_status,current_period_end,trial_end")
        .eq("id", user.id).maybeSingle();
      if (active) {
        setLiveProfile(error ? null : data);
        if (!error && data?.plan_id) {
          // Show the actual Stripe billing cadence when this dialog opens.
          const annualPrices = [
            "price_1TjxSJEfti9t9nN91VDBOxZX",
            "price_1TjxSKEfti9t9nN9iv48DJvm",
            "price_1TjxSLEfti9t9nN9GrF6F0Pw",
            "price_1SrHtOEfti9t9nN9fG4lSroa",
            "price_1SrHtPEfti9t9nN9dnZ0sXpi",
            "price_1SrHtQEfti9t9nN9GKvr4NSt",
            "price_1UQtGMEfti9t9nN973J7Avoy",
            "price_1UQtGWEfti9t9nN9QNQxVIYI",
            "price_1UQtGbEfti9t9nN9cNGQpdnJ",
          ];
          setBilling(annualPrices.includes(data.plan_id) ? "yearly" : "monthly");
        }
        setCheckingPlan(false);
      }
    })();
    return () => { active = false; };
  }, [open]);

  const currentNormalized = liveProfile && isActivePaidPlan(liveProfile)
    ? effectivePlanTier(liveProfile) : null;
  const currentPriceId = isActivePaidPlan(liveProfile) ? liveProfile?.plan_id : null;
  const priceIds: Record<string, string> = {
    ranki_starter_monthly: "price_1TjxSJEfti9t9nN9XgMVswCh",
    ranki_starter_yearly: "price_1TjxSJEfti9t9nN91VDBOxZX",
    ranki_pro_monthly: "price_1TjxSKEfti9t9nN9HAzRfqz8",
    ranki_pro_yearly: "price_1TjxSKEfti9t9nN9iv48DJvm",
    ranki_business_monthly: "price_1TjxSLEfti9t9nN9DqcufGNo",
    ranki_business_yearly: "price_1TjxSLEfti9t9nN9GrF6F0Pw",
    ranki_starter_monthly_usd: "price_1UQtGKEfti9t9nN9XyTCtHYK",
    ranki_starter_yearly_usd: "price_1UQtGMEfti9t9nN973J7Avoy",
    ranki_pro_monthly_usd: "price_1UQtGUEfti9t9nN9Fsfqwlfj",
    ranki_pro_yearly_usd: "price_1UQtGWEfti9t9nN9QNQxVIYI",
    ranki_business_monthly_usd: "price_1UQtGZEfti9t9nN9143Lii65",
    ranki_business_yearly_usd: "price_1UQtGbEfti9t9nN9cNGQpdnJ",
  };

  const handleCheckout = async (priceKey: string) => {
    setLoadingKey(priceKey);
    try {
      // An existing paid subscription must be changed through Stripe Billing
      // rather than creating a duplicate checkout subscription.
      if (currentNormalized) {
        const { data: portal, error: portalError } = await supabase.functions.invoke("create-portal-session", {
          body: { returnUrl: window.location.href },
        });
        if (portalError || !portal?.url) throw portalError || new Error("Unable to open billing portal");
        window.location.href = portal.url;
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: isEN ? "Error" : "Erreur",
        description: isEN ? "Unable to create payment session." : "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const handleBuyCredits = async (pack: CreditPack) => {
    setLoadingCredits(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey: pack.priceKey,
          mode: "payment",
          successUrl: `${window.location.origin}/dashboard?credits_success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error("Credits checkout error:", error);
      toast({
        title: isEN ? "Error" : "Erreur",
        description: isEN ? "Unable to create payment session." : "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingCredits(false);
    }
  };

  const selectedPack = creditPacks.find((pack) => pack.priceKey === selectedPackKey) ?? creditPacks[1];
  const visiblePacks = showAllPacks ? creditPacks : creditPacks.slice(0, 4);
  const formatEuros = (price: number) =>
    new Intl.NumberFormat(isEN ? "en-GB" : "fr-FR", {
      minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price) + " €";

  return (
    <Dialog open={open} onOpenChange={locked ? () => {} : onOpenChange}>
      <DialogContent
        onInteractOutside={locked ? (event) => event.preventDefault() : undefined}
        onEscapeKeyDown={locked ? (event) => event.preventDefault() : undefined}
        className={
          "w-[calc(100vw-1rem)] max-w-[1024px] max-h-[92dvh] overflow-y-auto p-0 gap-0 rounded-2xl sm:rounded-3xl bg-background shadow-2xl border border-border/70 " +
          (locked ? "[&>button.absolute]:hidden" : "")
        }
      >
        <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-5 pt-6 pb-5 sm:px-8 sm:pt-7 sm:pb-6">
          <div className="absolute -top-24 -right-24 size-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-3 sm:gap-4">
            <div className="shrink-0 flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              {exhausted ? <LockKeyhole className="size-5 sm:size-6" /> : <Crown className="size-5 sm:size-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-left">
                  {exhausted
                    ? (isEN ? "Get back to your dashboard" : "Retrouvez votre tableau de bord")
                    : (isEN ? "Choose how to continue" : "Choisissez comment continuer")}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                {exhausted
                  ? (isEN
                    ? "You've used your available credits. Choose a subscription or buy a credit pack to restore access."
                    : "Vous avez utilisé vos crédits disponibles. Choisissez un abonnement ou rechargez vos crédits pour retrouver l’accès.")
                  : (isEN
                    ? "Choose a subscription or top up with a one-time credit pack. Secure checkout."
                    : "Choisissez un abonnement ou une recharge ponctuelle. Paiement sécurisé.")}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 pt-6 pb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {isEN ? "1. Choose a subscription" : "1. Choisir un abonnement"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isEN ? "Recurring billing · Cancel anytime" : "Facturation récurrente · Résiliable à tout moment"}
              </p>
            </div>
            <div className="inline-flex self-start sm:self-auto items-center p-1 rounded-xl bg-muted border border-border" role="group" aria-label={isEN ? "Billing period" : "Période de facturation"}>
              <button
                type="button"
                aria-pressed={billing === "monthly"}
                onClick={() => setBilling("monthly")}
                className={billing === "monthly"
                  ? "px-4 py-2 rounded-lg text-sm font-semibold bg-card text-foreground shadow-sm"
                  : "px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"}
              >
                {isEN ? "Monthly" : "Mensuel"}
              </button>
              <button
                type="button"
                aria-pressed={billing === "yearly"}
                onClick={() => setBilling("yearly")}
                className={billing === "yearly"
                  ? "px-4 py-2 rounded-lg text-sm font-semibold bg-card text-foreground shadow-sm"
                  : "px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"}
              >
                {isEN ? "Yearly" : "Annuel"}
              </button>
              <span className="mr-1.5 rounded-md bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                -20%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-3 sm:gap-4">
            {PLANS.map((plan) => {
              const eur = billing === "yearly" ? plan.yearly : plan.monthly;
              const tier = isEN
                ? { price: "$" + eur.price.replace("€", "").replace(",", "."), key: eur.key + "_usd" }
                : eur;
              const features = isEN ? plan.features.en : plan.features.fr;
              const isCurrent = Boolean(currentNormalized === plan.id && currentPriceId === priceIds[tier.key]);
              const isLoading = loadingKey === tier.key;
              return (
                <div
                  key={plan.id}
                  className={plan.highlight
                    ? "relative rounded-2xl border-2 border-primary bg-primary/[0.04] p-4 sm:p-5 flex flex-col shadow-sm"
                    : "relative rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col"}
                >
                  <div className="flex items-center justify-between gap-2 min-h-6">
                    <h4 className="text-base font-bold text-foreground">{plan.name}</h4>
                    {plan.highlight && (
                      <Badge className="shrink-0 rounded-full bg-primary text-primary-foreground text-[10px] px-2.5 py-1">
                        <BrandSparkle className="size-3 mr-1" />
                        {isEN ? "POPULAR" : "POPULAIRE"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground min-h-5 mt-1">
                    {isEN ? plan.tagline.en : plan.tagline.fr}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">
                      {billing === "yearly" ? (isEN ? "/year" : "/an") : (isEN ? "/month" : "/mois")}
                    </span>
                  </div>
                  {billing === "yearly" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isEN ? "Approx." : "Soit env."} {new Intl.NumberFormat(isEN ? "en-US" : "fr-FR", { style: "currency", currency: isEN ? "USD" : "EUR" }).format(Number(tier.price.replace(/[^0-9.,]/g, "").replace(",", ".")) / 12)}/{isEN ? "month" : "mois"}
                    </p>
                  )}
                  <div className="my-4 border-t border-border/60" />
                  <ul className="space-y-2 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs sm:text-[13px] leading-snug">
                        <Check className="size-4 mt-0.5 text-primary shrink-0" />
                        <span className="text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    onClick={() => handleCheckout(tier.key)}
                    disabled={Boolean(loadingKey) || loadingCredits || isCurrent}
                    className="w-full h-11 mt-5 rounded-xl font-semibold gap-2"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {isLoading
                      ? <Loader2 className="size-4 animate-spin" />
                      : isCurrent
                        ? (isEN ? "Current plan" : "Offre actuelle")
                        : <>{currentNormalized ? (isEN ? "Manage billing" : "Gérer l'abonnement") : (isEN ? "Choose" : "Choisir")} {plan.name}<ArrowRight className="size-4" /></>}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border/70 bg-muted/30 px-4 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Coins className="size-5 text-primary" />
                {isEN ? "2. Or buy credits, no subscription" : "2. Ou acheter des crédits, sans abonnement"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isEN ? "One-time purchase. Select a pack, then continue to payment." : "Achat ponctuel. Sélectionnez un pack, puis passez au paiement."}
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {isEN ? "No automatic renewal" : "Sans renouvellement automatique"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="group" aria-label={isEN ? "Available credit packs" : "Packs de crédits disponibles"}>
            {visiblePacks.map((pack) => {
              const selected = selectedPack.priceKey === pack.priceKey;
              return (
                <button
                  key={pack.priceKey}
                  type="button"
                  onClick={() => setSelectedPackKey(pack.priceKey)}
                  aria-pressed={selected}
                  disabled={loadingCredits}
                  className={
                    "relative min-h-20 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                    (selected
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-sm")
                  }
                >
                  {selected && <CheckCircle2 className="absolute top-2 right-2 size-4 text-primary" />}
                  <span className="block text-sm sm:text-base font-bold text-foreground pr-5">
                    {pack.credits.toLocaleString(isEN ? "en-GB" : "fr-FR")}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {isEN ? "credits" : "crédits"}
                  </span>
                  <span className="block font-semibold text-primary text-sm mt-1">{formatEuros(pack.price)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
            <button
              type="button"
              onClick={() => setShowAllPacks((v) => !v)}
              className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-primary hover:underline"
              aria-expanded={showAllPacks}
            >
              <ChevronDown className={"size-3.5 transition-transform " + (showAllPacks ? "rotate-180" : "")} />
              {showAllPacks
                ? (isEN ? "Show fewer packs" : "Voir moins de packs")
                : (isEN ? "See 5 more packs" : "Voir les 5 autres packs")}
            </button>

            <Button
              type="button"
              onClick={() => handleBuyCredits(selectedPack)}
              disabled={loadingCredits || Boolean(loadingKey)}
              className="w-full sm:w-auto sm:min-w-72 rounded-xl h-11 font-semibold gap-2"
            >
              {loadingCredits
                ? <Loader2 className="size-4 animate-spin" />
                : <>{isEN ? "Buy" : "Acheter"} {selectedPack.credits.toLocaleString(isEN ? "en-GB" : "fr-FR")} {isEN ? "credits" : "crédits"} — {formatEuros(selectedPack.price)} <ArrowRight className="size-4" /></>}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center px-4 sm:px-8 py-4 border-t border-border/60 bg-background">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            {isEN ? "Secure payment with Stripe" : "Paiement sécurisé avec Stripe"}
          </span>
          {locked && (
            <div className="flex flex-wrap w-full sm:w-auto justify-center sm:justify-end items-center gap-3">
              {onRetry && (
                <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-2">
                  <RefreshCw className="size-3.5" />
                  {isEN ? "Already paid? Refresh" : "Déjà payé ? Actualiser"}
                </Button>
              )}
              {onSignOut && (
                <Button type="button" variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground">
                  {isEN ? "Sign out" : "Se déconnecter"}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
