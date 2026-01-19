import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  Building2, 
  MessageSquare,
  Loader2,
  ArrowRight
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  businesses: string;
  features: string[];
  popular?: boolean;
  color: string;
  hasTrial?: boolean;
  trialDays?: number;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 2.99,
    priceYearly: 28.70,
    credits: 10,
    businesses: "1",
    features: ["Réponses IA", "Sync automatique", "Support email"],
    color: "from-blue-500 to-blue-600",
    hasTrial: true,
    trialDays: 3,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29.99,
    priceYearly: 287.90,
    credits: 100,
    businesses: "2",
    features: ["Tout Starter +", "IA premium", "Priorité réponses", "Analytics"],
    popular: true,
    color: "from-primary to-primary/80",
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    priceYearly: 950.40,
    credits: 400,
    businesses: "Illimité",
    features: ["Tout Pro +", "SEO AutoPost", "API access", "Support prioritaire"],
    color: "from-violet-500 to-violet-600",
  },
];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
}

export const UpgradeDialog = ({ open, onOpenChange, currentPlan }: UpgradeDialogProps) => {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    setLoadingPlan(plan.id);

    try {
      const priceKey = `${plan.id}_${isYearly ? "yearly" : "monthly"}`;
      
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
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-gradient-to-b from-background to-muted/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Passez au niveau supérieur
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground mt-2">
              Débloquez toute la puissance de l'IA pour vos avis
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Mensuel
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isYearly ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    isYearly ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Annuel
              </span>
              {isYearly && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  -20%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="px-6 pb-8 pt-2">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan?.toLowerCase() === plan.id;
              const price = isYearly ? plan.priceYearly / 12 : plan.priceMonthly;
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-5 transition-all ${
                    plan.popular
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  } ${isCurrentPlan ? "opacity-60" : ""}`}
                >
                  {plan.hasTrial && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-500 text-white shadow-lg">
                        🎁 {plan.trialDays} jours gratuits
                      </Badge>
                    </div>
                  )}
                  
                  {plan.popular && !plan.hasTrial && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Populaire
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                    {plan.hasTrial && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        0€ aujourd'hui
                      </p>
                    )}
                    <div className="mt-2">
                      <span className={`text-3xl font-bold ${plan.hasTrial ? "text-muted-foreground" : "text-foreground"}`}>
                        {price.toFixed(2).replace(".", ",")}€
                      </span>
                      <span className="text-muted-foreground text-sm">/mois</span>
                    </div>
                    {plan.hasTrial && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Après {plan.trialDays} jours d'essai
                      </p>
                    )}
                    {isYearly && !plan.hasTrial && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Facturé {plan.priceYearly.toFixed(2).replace(".", ",")}€/an
                      </p>
                    )}
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-foreground">{plan.credits}</p>
                      <p className="text-[10px] text-muted-foreground">crédits</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <Building2 className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-foreground">{plan.businesses}</p>
                      <p className="text-[10px] text-muted-foreground">business</p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan || loadingPlan === plan.id}
                    className={`w-full rounded-xl h-11 font-semibold transition-all ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Plan actuel"
                    ) : plan.hasTrial ? (
                      <>
                        Essayer gratuitement
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Choisir
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Annuler à tout moment
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Paiement sécurisé
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Support 24/7
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
