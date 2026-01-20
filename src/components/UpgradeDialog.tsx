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
import { Crown, Check, Shield, Sparkles } from "lucide-react";
import { PlanCard } from "@/components/PlanCard";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  businesses: string;
  features: string[];
  popular?: boolean;
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
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    priceYearly: 950.40,
    credits: 400,
    businesses: "Illimité",
    features: ["Tout Pro +", "SEO AutoPost", "API access", "Support prioritaire"],
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
                Choisissez <span className="text-primary">votre plan</span>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-1">
              Débloquez toute la puissance de l'IA
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
                <Badge className="bg-foreground/10 text-foreground border-foreground/20 text-xs">
                  -20%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Plans Stack */}
        <div className="px-4 pb-6 pt-2 space-y-5">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.toLowerCase() === plan.id;
            
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                isLoading={loadingPlan === plan.id}
                isCurrentPlan={isCurrentPlan}
                onSelect={() => handleSelectPlan(plan)}
              />
            );
          })}

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-foreground" />
            <span>Paiement 100% sécurisé</span>
            <Shield className="w-3 h-3 text-foreground" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
