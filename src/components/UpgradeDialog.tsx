import { useState } from "react";
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
import { Crown, Shield, Coins, ChevronDown, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandSparkle } from "@/components/BrandSparkle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    tagline: { fr: "Avis + GEO + SEO/AEO auto", en: "Reviews + GEO + SEO/AEO auto" },
    monthly: { price: "49€", key: "ranki_pro_monthly" },
    yearly:  { price: "470€", key: "ranki_pro_yearly" },
    features: {
      fr: ["Jusqu'à 3 établissements", "Réponses IA illimitées", "GEO Rank quotidien", "Posts SEO + Q&R AEO automatiques", "Support prioritaire"],
      en: ["Up to 3 locations", "Unlimited AI replies", "Daily GEO ranking", "Automatic SEO posts + AEO Q&A", "Priority support"],
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
      fr: ["Établissements illimités", "Posts & Q&R illimités", "API & webhooks", "Manager dédié", "Rapports personnalisés"],
      en: ["Unlimited locations", "Unlimited posts & Q&A", "API & webhooks", "Dedicated manager", "Custom reports"],
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

export const UpgradeDialog = ({ open, onOpenChange, currentPlan }: UpgradeDialogProps) => {
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const currentNormalized = normalizePlan(currentPlan);

  const handleCheckout = async (priceKey: string) => {
    setLoadingKey(priceKey);
    try {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-gradient-to-b from-background to-muted/30 max-h-[90vh] overflow-y-auto">
        <div className="relative px-6 pt-8 pb-4 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-primary/30">
            <Crown className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isEN ? "Choose your plan" : "Choisissez votre plan"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {isEN ? "7-day free trial. Cancel anytime." : "Essai gratuit 7 jours. Résiliable à tout moment."}
          </p>

          {/* Billing toggle */}
          <div className="mt-5 flex justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-muted border border-border">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  billing === "monthly" ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                {isEN ? "Monthly" : "Mensuel"}
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                  billing === "yearly" ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                {isEN ? "Yearly" : "Annuel"}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">-20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="px-4 pb-4 pt-2 grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const tier = billing === "yearly" ? p.yearly : p.monthly;
            const features = isEN ? p.features.en : p.features.fr;
            const isCurrent = currentNormalized === p.id;
            const isLoading = loadingKey === tier.key;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border ${
                  p.highlight ? "border-2 border-primary bg-primary/5" : "border-border bg-card"
                } p-5 flex flex-col`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg px-3 py-1 text-[10px] font-semibold">
                      <BrandSparkle className="w-3 h-3 mr-1" />
                      {isEN ? "MOST POPULAR" : "LE PLUS POPULAIRE"}
                    </Badge>
                  </div>
                )}
                <h3 className="font-bold text-base text-foreground mt-2">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-foreground">{tier.price}</span>
                  <span className="text-xs text-muted-foreground">
                    {billing === "yearly" ? (isEN ? "/year" : "/an") : (isEN ? "/month" : "/mois")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isEN ? p.tagline.en : p.tagline.fr}
                </p>
                <ul className="mt-4 space-y-2 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout(tier.key)}
                  disabled={isLoading || isCurrent}
                  className={`w-full mt-5 rounded-xl h-10 font-semibold ${
                    p.highlight ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""
                  }`}
                  variant={p.highlight ? "default" : "outline"}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    isEN ? "✓ Current plan" : "✓ Plan actuel"
                  ) : (
                    isEN ? "Start 7-day free trial" : "Essai gratuit 7 jours"
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Credit Packs */}
        <div className="px-4 pb-6 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">{isEN ? "Top up credits" : "Recharger des crédits"}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between rounded-xl h-12" disabled={loadingCredits}>
                {loadingCredits ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {isEN ? "Loading..." : "Chargement..."}</>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-primary" />
                      {isEN ? "Choose a credit pack" : "Choisir un pack de crédits"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[400px]" align="center">
              {creditPacks.map((pack) => (
                <DropdownMenuItem key={pack.priceKey} onClick={() => handleBuyCredits(pack)} className="flex items-center justify-between py-3 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">{pack.credits.toLocaleString()} {isEN ? "credits" : "crédits"}</span>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">{pack.price}€</Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-center gap-2 pb-4 text-xs text-muted-foreground">
          <BrandSparkle className="w-3 h-3 text-foreground" />
          <span>{isEN ? "100% secure payment" : "Paiement 100% sécurisé"}</span>
          <Shield className="w-3 h-3 text-foreground" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
