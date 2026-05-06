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
import { Crown, Shield, Sparkles, Coins, ChevronDown, Loader2, Check, ArrowRight, Star, Zap, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

export const UpgradeDialog = ({ open, onOpenChange, currentPlan }: UpgradeDialogProps) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const currencySymbol = isEN ? "$" : "€";
  const priceLabel = isEN ? "$9.99" : "9,99€";
  const agencyPriceLabel = isEN ? "$49" : "49€";
  const dailyPriceKey = isEN ? "daily_monthly_usd" : "daily_monthly_eur";
  const agencyPriceKey = "agency_eu_monthly";

  const [isLoading, setIsLoading] = useState(false);
  const [loadingAgency, setLoadingAgency] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const isAlreadyUpgraded = currentPlan?.toLowerCase() === "daily" || currentPlan?.toLowerCase() === "pro" || currentPlan?.toLowerCase() === "business";

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey: dailyPriceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: isEN ? "Error" : "Erreur",
        description: isEN ? "Unable to create payment session." : "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Credits checkout error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingCredits(false);
    }
  };

  const handleAgency = async () => {
    setLoadingAgency(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey: agencyPriceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error("Agency checkout error:", error);
      toast({
        title: isEN ? "Error" : "Erreur",
        description: isEN ? "Unable to create payment session." : "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingAgency(false);
    }
  };

  const starterFeatures = isEN
    ? [
        "1 location",
        "Weekly GEO reports (3 keywords)",
        "AI replies to Google reviews",
        "25 free credits / month",
      ]
    : [
        "1 établissement",
        "Rapports GEO hebdomadaires (3 mots-clés)",
        "Réponses IA aux avis Google",
        "25 crédits gratuits / mois",
      ];

  const dailyFeatures = isEN
    ? [
        "Up to 3 locations",
        "Daily GEO tracking (unlimited keywords)",
        "Daily SEO posts + AEO Q&A on Google",
        "Competitor analysis",
        "Priority support",
      ]
    : [
        "Jusqu'à 3 établissements",
        "Suivi GEO quotidien (mots-clés illimités)",
        "Posts SEO + Q&A AEO quotidiens sur Google",
        "Analyse de la concurrence",
        "Support prioritaire",
      ];

  const agencyFeatures = isEN
    ? [
        "Unlimited locations",
        "Per-location usage tracking",
        "1000 credits / month (pool)",
        "White-label reports",
        "API access",
        "Dedicated account manager",
      ]
    : [
        "Établissements illimités",
        "Suivi de consommation par établissement",
        "1000 crédits / mois (pool à allouer)",
        "Rapports en marque blanche",
        "Accès API",
        "Account manager dédié",
      ];

  const isStarter = !currentPlan || currentPlan?.toLowerCase() === "free" || currentPlan?.toLowerCase() === "starter";
  const isDaily = currentPlan?.toLowerCase() === "daily" || currentPlan?.toLowerCase() === "pro";
  const isAgency = currentPlan?.toLowerCase() === "agency" || currentPlan?.toLowerCase() === "business";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-b from-background to-muted/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-primary/30">
              <Crown className="w-7 h-7 text-primary-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {isEN ? "Choose your plan" : "Choisissez votre plan"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              {isEN ? "Simple pricing. Massive AI visibility." : "Une tarification simple. Une visibilité IA massive."}
            </p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="px-4 pb-4 pt-2 grid md:grid-cols-3 gap-4">
          {/* Starter (Free) */}
          <div className="relative rounded-2xl border border-border bg-card p-5 flex flex-col">
            <h3 className="font-bold text-base text-foreground">Starter</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground">{isEN ? "Free" : "Gratuit"}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isEN
                ? "Track your AI ranking and reply to reviews — free forever."
                : "Suivez votre positionnement IA et répondez aux avis — gratuit à vie."}
            </p>
            <ul className="mt-4 space-y-2 flex-1">
              {starterFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full mt-5 rounded-xl h-10 font-semibold"
              disabled={isStarter}
              onClick={() => { onOpenChange(false); navigate("/dashboard"); }}
            >
              {isStarter ? (isEN ? "✓ Current plan" : "✓ Plan actuel") : (isEN ? "Get started free" : "Commencer gratuitement")}
            </Button>
          </div>

          {/* Daily (highlight) */}
          <div className="relative rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-5 flex flex-col md:scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-destructive text-white shadow-lg px-3 py-1 text-[10px] font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                {isEN ? "MOST POPULAR" : "LE PLUS POPULAIRE"}
              </Badge>
            </div>
            <h3 className="font-bold text-base text-foreground mt-2">{isEN ? "Daily" : "Quotidien"}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground">{priceLabel}</span>
              <span className="text-xs text-muted-foreground">{isEN ? "/month" : "/mois"}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isEN
                ? "Win the AI search war on autopilot."
                : "Gagnez la guerre du référencement IA en pilote automatique."}
            </p>
            <ul className="mt-4 space-y-2 flex-1">
              {dailyFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={handleUpgrade}
              disabled={isLoading || isDaily || isAgency}
              className="w-full mt-5 rounded-xl h-10 font-semibold bg-destructive hover:bg-destructive/90 text-white shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isDaily ? (
                isEN ? "✓ Current plan" : "✓ Plan actuel"
              ) : (
                isEN ? "Free 7-day trial" : "Essai gratuit 7 jours"
              )}
            </Button>
          </div>

          {/* Agency */}
          <div className="relative rounded-2xl border border-border bg-card p-5 flex flex-col">
            <h3 className="font-bold text-base text-foreground">{isEN ? "Agency" : "Agence"}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground">{agencyPriceLabel}</span>
              <span className="text-xs text-muted-foreground">{isEN ? "/month" : "/mois"}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isEN
                ? "For multi-location brands and agencies (10+ locations)."
                : "Pour les marques multi-établissements et agences (10+ établissements)."}
            </p>
            <ul className="mt-4 space-y-2 flex-1">
              {agencyFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full mt-5 rounded-xl h-10 font-semibold"
              onClick={handleAgency}
              disabled={loadingAgency || isAgency}
            >
              {loadingAgency ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAgency ? (
                isEN ? "✓ Current plan" : "✓ Plan actuel"
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  {isEN ? "Get started" : "Démarrer"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Credit Packs Section */}
        <div className="px-4 pb-6 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">{isEN ? "Top up credits" : "Recharger des crédits"}</span>
            <Badge variant="outline" className="text-[10px] ml-auto">~0.30{currencySymbol}/{isEN ? "credit" : "crédit"}</Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between rounded-xl h-12"
                disabled={loadingCredits}
              >
                {loadingCredits ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-primary" />
                      Choisir un pack de crédits
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[400px]" align="center">
              {creditPacks.map((pack) => (
                <DropdownMenuItem 
                  key={pack.priceKey}
                  onClick={() => handleBuyCredits(pack)}
                  className="flex items-center justify-between py-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{pack.credits.toLocaleString()} crédits</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(pack.price / pack.credits * 100).toFixed(1)}¢/crédit)
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">{pack.price}€</Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 pb-4 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-foreground" />
          <span>Paiement 100% sécurisé</span>
          <Shield className="w-3 h-3 text-foreground" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
