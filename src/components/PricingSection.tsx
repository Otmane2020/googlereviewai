import { useState } from "react";
import { Button } from "./ui/button";
import { Check, Zap, Star, Battery, Crown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const subscriptionPlans = [
  { 
    name: "Starter", 
    credits: 10, 
    priceMonthly: "2,99€",
    priceYearly: "28,70€",
    priceMonthlyEquiv: "2,39€",
    businesses: "1 établissement",
    icon: Battery,
    priceKeyMonthly: "starter_monthly",
    priceKeyYearly: "starter_yearly",
    features: ["10 crédits IA/mois", "1 établissement", "Réponses personnalisées", "Support email"]
  },
  { 
    name: "Pro", 
    credits: 100, 
    priceMonthly: "29,99€",
    priceYearly: "287,90€",
    priceMonthlyEquiv: "23,99€",
    businesses: "2 établissements",
    popular: true, 
    icon: Zap,
    priceKeyMonthly: "pro_monthly",
    priceKeyYearly: "pro_yearly",
    features: ["100 crédits IA/mois", "2 établissements", "Réponses personnalisées", "Support prioritaire", "Statistiques avancées"]
  },
  { 
    name: "Business", 
    credits: 400, 
    priceMonthly: "99€",
    priceYearly: "950,40€",
    priceMonthlyEquiv: "79,20€",
    businesses: "Illimité",
    icon: Crown,
    priceKeyMonthly: "business_monthly",
    priceKeyYearly: "business_yearly",
    features: ["400 crédits IA/mois", "Établissements illimités", "Réponses personnalisées", "Support dédié", "Statistiques avancées", "API access"]
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (priceKey: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoadingPlan(priceKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/#pricing`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création du paiement";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-14 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-5">
            <Star className="w-4 h-4 text-accent" />
            <span className="text-accent-foreground text-xs sm:text-sm font-semibold">Tarifs transparents</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choisissez votre plan
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            1 crédit = 1 réponse IA générée pour vos avis Google
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-full">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {subscriptionPlans.map((plan) => {
            const priceKey = billingCycle === "monthly" ? plan.priceKeyMonthly : plan.priceKeyYearly;
            const isLoading = loadingPlan === priceKey;

            return (
              <div
                key={plan.name}
                className={`relative bg-card p-5 sm:p-6 rounded-xl border text-center transition-all hover:shadow-lg ${
                  plan.popular ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md">
                      Populaire
                    </span>
                  </div>
                )}
                
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center mx-auto mb-3">
                  <plan.icon className="w-6 h-6 text-primary" />
                </div>
                
                <h4 className="text-lg font-bold text-foreground mb-1">{plan.name}</h4>
                <p className="text-muted-foreground text-xs mb-3">{plan.businesses}</p>
                
                <div className="mb-4">
                  {billingCycle === "yearly" ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">{plan.priceMonthlyEquiv}</span>
                      <span className="text-muted-foreground text-sm">/mois</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Facturé {plan.priceYearly}/an
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">{plan.priceMonthly}</span>
                      <span className="text-muted-foreground text-sm">/mois</span>
                    </>
                  )}
                </div>
                
                <ul className="space-y-2 mb-5 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-secondary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className="w-full" 
                  onClick={() => handleSubscribe(priceKey)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Commencer"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
