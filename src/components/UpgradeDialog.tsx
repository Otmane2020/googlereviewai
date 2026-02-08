import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Shield, Sparkles, Coins, ChevronDown, Loader2, Check, Gift } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Single all-in-one plan
const PLAN = {
  id: "allinone",
  name: "Starlinko Tout-en-Un",
  priceMonthly: 39,
  priceYearly: 390,
  description: "Pack complet SEO + AEO + Réponses IA",
  features: [
    "Réponses IA illimitées aux avis Google",
    "Articles SEO générés automatiquement",
    "Optimisation AEO pour ChatGPT",
    "Publication automatique sur Google",
    "Tableau de bord analytics",
    "Support prioritaire",
  ],
};

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
  const hasActivePlan = !!currentPlan && currentPlan.toLowerCase() !== "free";
  const [isYearly, setIsYearly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const priceKey = `allinone_${isYearly ? "yearly" : "monthly"}`;
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement.",
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
      } else {
        throw new Error("No checkout URL returned");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-gradient-to-b from-background to-muted/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-primary/30">
              <Crown className="w-7 h-7 text-primary-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Offre <span className="text-primary">Tout-en-Un</span>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-1">
              {PLAN.description}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Mensuel
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 rounded-full transition-colors border-2 ${
                  isYearly 
                    ? "bg-primary border-primary" 
                    : "bg-muted border-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-transform ${
                    isYearly 
                      ? "translate-x-7 bg-primary-foreground" 
                      : "translate-x-1 bg-primary"
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Annuel
              </span>
              {isYearly && (
                <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  2 mois offerts
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Plan Card */}
        <div className="px-4 pb-4 pt-2">
          <div className="relative bg-card p-5 rounded-2xl border-2 border-primary shadow-lg ring-2 ring-primary/20">
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                <Sparkles className="w-3 h-3" />
                Offre Unique
              </span>
            </div>

            {/* Price */}
            <div className="text-center mt-3 mb-4">
              {isYearly ? (
                <>
                  <div className="bg-secondary/10 rounded-xl p-3 mb-2">
                    <p className="text-xs text-muted-foreground mb-1">Aujourd'hui</p>
                    <span className="text-3xl font-bold text-secondary">0€</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1 text-secondary text-sm">
                      <Gift className="w-4 h-4 animate-bounce" />
                      <span className="font-bold">2 mois offerts !</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Dans 2 mois</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-xl font-bold text-foreground">390€</span>
                      <span className="text-sm text-muted-foreground">/an</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Soit 32,50€/mois au lieu de 39€
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-bold text-foreground">39€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-4">
              {PLAN.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-secondary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              className="w-full"
              size="lg"
              disabled={isLoading || hasActivePlan}
              onClick={handleSubscribe}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : hasActivePlan ? (
                "Déjà abonné"
              ) : isYearly ? (
                "Démarrer mon essai gratuit"
              ) : (
                "Commencer maintenant"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-2">
              Annuler à tout moment • Paiement sécurisé
            </p>
          </div>
        </div>

        {/* Credit Packs Section */}
        <div className="px-4 pb-6 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Recharger des crédits</span>
            <Badge variant="outline" className="text-[10px] ml-auto">~0.30€/crédit</Badge>
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
