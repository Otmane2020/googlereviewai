import { useState } from "react";
import { Button } from "./ui/button";
import { Check, Star, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const PricingSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    t("pricing.allinone.feature1"),
    t("pricing.allinone.feature2"),
    t("pricing.allinone.feature3"),
    t("pricing.allinone.feature4"),
    t("pricing.allinone.feature5"),
    t("pricing.allinone.feature6"),
  ];

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const priceKey = billingCycle === "monthly" ? "allinone_monthly" : "allinone_yearly";
    setIsLoading(true);
    
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
      const message = error instanceof Error ? error.message : t("errors.paymentError");
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-14 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-5">
            <Star className="w-4 h-4 text-accent" />
            <span className="text-accent-foreground text-xs sm:text-sm font-semibold">{t("pricing.allinone.badge")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("pricing.allinone.title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            {t("pricing.allinone.subtitle")}
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
              {t("pricing.monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("pricing.yearly")}
              <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                {t("pricing.allinone.freeMonths")}
              </span>
            </button>
          </div>
        </div>

        {/* Single All-in-One Plan */}
        <div className="max-w-lg mx-auto">
          <div className="relative bg-card p-6 sm:p-8 rounded-2xl border-2 border-primary shadow-xl ring-2 ring-primary/20">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-lg">
                <Sparkles className="w-4 h-4" />
                {t("pricing.allinone.badge")}
              </span>
            </div>
            
            {/* Plan name */}
            <div className="text-center mt-4 mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {t("pricing.allinone.name")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("pricing.allinone.description")}
              </p>
            </div>
            
            {/* Price */}
            <div className="text-center mb-6">
              {billingCycle === "yearly" ? (
                <>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-bold text-foreground">32,50€</span>
                    <span className="text-muted-foreground text-lg">{t("pricing.perMonth")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("pricing.billedYearly", { price: "390€" })}
                  </p>
                  <p className="text-sm text-secondary font-medium mt-1">
                    {t("pricing.allinone.savings")}
                  </p>
                </>
              ) : (
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl sm:text-5xl font-bold text-foreground">39€</span>
                  <span className="text-muted-foreground text-lg">{t("pricing.perMonth")}</span>
                </div>
              )}
            </div>
            
            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-secondary" />
                  </div>
                  <span className="text-foreground text-sm sm:text-base">{feature}</span>
                </li>
              ))}
            </ul>
            
            {/* CTA Button */}
            <Button 
              size="lg"
              className="w-full text-lg py-6" 
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("pricing.getStarted")
              )}
            </Button>
            
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
             <span>Annuler à tout moment</span>
              <span>•</span>
              <span>{t("pricing.noCreditCard")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
