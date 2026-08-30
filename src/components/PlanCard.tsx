import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Star, Zap, Check, Loader2 } from "lucide-react";
import { BrandSparkle } from "@/components/BrandSparkle";

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

interface PlanCardProps {
  plan: Plan;
  isYearly: boolean;
  isLoading: boolean;
  isCurrentPlan?: boolean;
  isLowerTier?: boolean;
  onSelect: () => void;
}

export const PlanCard = ({ 
  plan, 
  isYearly, 
  isLoading, 
  isCurrentPlan = false,
  isLowerTier = false,
  onSelect 
}: PlanCardProps) => {
  const isDisabled = isCurrentPlan || isLowerTier;
  const price = isYearly ? plan.priceYearly / 12 : plan.priceMonthly;
  
  // Determine card style based on plan type
  const getCardStyle = () => {
    if (plan.hasTrial) {
      return {
        border: "border-primary",
        bg: "bg-primary/5",
        iconBg: "bg-primary",
        iconColor: "text-primary-foreground",
        buttonBg: "bg-primary hover:bg-primary/90",
        badgeBg: "bg-primary",
        Icon: Gift,
      };
    }
    if (plan.popular) {
      return {
        border: "border-destructive/50",
        bg: "bg-destructive/5",
        iconBg: "bg-destructive/20",
        iconColor: "text-destructive",
        buttonBg: "bg-destructive hover:bg-destructive/90",
        badgeBg: "bg-destructive",
        Icon: Star,
      };
    }
    return {
      border: "border-secondary/50",
      bg: "bg-secondary/5",
      iconBg: "bg-secondary/20",
      iconColor: "text-secondary",
      buttonBg: "bg-secondary hover:bg-secondary/90",
      badgeBg: "bg-secondary",
      Icon: Zap,
    };
  };

  const style = getCardStyle();
  const IconComponent = style.Icon;

  return (
    <div 
      className={`relative rounded-2xl border-2 ${style.border} ${style.bg} p-4 transition-all ${
        isDisabled ? "opacity-60" : ""
      }`}
    >
      {/* Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <Badge className={`${style.badgeBg} text-white shadow-lg px-3 py-1 text-xs font-semibold`}>
          {plan.hasTrial ? (
            <>
              <Gift className="w-3 h-3 mr-1" />
              ESSAI {plan.trialDays} JOURS
            </>
          ) : plan.popular ? (
            <>
              <BrandSparkle className="w-3 h-3 mr-1" />
              POPULAIRE
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 mr-1" />
              PREMIUM
            </>
          )}
        </Badge>
      </div>

      {/* Content Row */}
      <div className="flex items-center gap-4 mt-3">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0`}>
          <IconComponent className={`w-7 h-7 ${style.iconColor}`} />
        </div>

        {/* Plan Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">
            {plan.credits} crédits • {plan.businesses} business
          </p>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-foreground">
            {plan.hasTrial ? "0€" : `${price.toFixed(2).replace(".", ",")}€`}
          </div>
          <div className="text-xs text-muted-foreground">
            {plan.hasTrial ? `puis ${price.toFixed(2).replace(".", ",")}€` : "/mois"}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onSelect}
        disabled={isDisabled || isLoading}
        className={`w-full mt-4 rounded-xl h-12 font-semibold text-white ${style.buttonBg} shadow-lg`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isCurrentPlan ? (
          "✓ Plan actuel"
        ) : isLowerTier ? (
          "Plan inférieur"
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            {plan.hasTrial ? "Démarrer l'essai" : `Choisir ${plan.name}`}
          </>
        )}
      </Button>
    </div>
  );
};
