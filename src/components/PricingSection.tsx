import { useState } from "react";
import { Button } from "./ui/button";
import { Check, Star, Sparkles, Loader2, Gift, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";

export const PricingSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const plans = [
    {
      id: "starter",
      name: t("pricing.plans.starter"),
      priceMonthly: 2.99,
      priceYearly: 2.39,
      features: [
        t("pricing.planFeatures.starter1"),
        t("pricing.planFeatures.starter2"),
        t("pricing.planFeatures.starter3"),
      ],
      hasTrial: true,
      trialDays: 3,
      style: {
        border: "border-primary",
        bg: "bg-primary/5",
        iconBg: "bg-primary",
        iconColor: "text-primary-foreground",
        buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
        badgeClass: "bg-primary text-primary-foreground",
        Icon: Gift,
      },
    },
    {
      id: "pro",
      name: t("pricing.plans.pro"),
      priceMonthly: 29.99,
      priceYearly: 23.99,
      features: [
        t("pricing.planFeatures.pro1"),
        t("pricing.planFeatures.pro2"),
        t("pricing.planFeatures.pro3"),
        t("pricing.planFeatures.pro4"),
      ],
      popular: true,
      style: {
        border: "border-destructive/50",
        bg: "bg-destructive/5",
        iconBg: "bg-destructive/20",
        iconColor: "text-destructive",
        buttonClass: "bg-destructive hover:bg-destructive/90 text-white",
        badgeClass: "bg-destructive text-white",
        Icon: Star,
      },
    },
    {
      id: "business",
      name: t("pricing.plans.business"),
      priceMonthly: 99,
      priceYearly: 79.20,
      features: [
        t("pricing.planFeatures.business1"),
        t("pricing.planFeatures.business2"),
        t("pricing.planFeatures.business3"),
        t("pricing.planFeatures.business4"),
        t("pricing.planFeatures.business5"),
      ],
      style: {
        border: "border-secondary/50",
        bg: "bg-secondary/5",
        iconBg: "bg-secondary/20",
        iconColor: "text-secondary",
        buttonClass: "bg-secondary hover:bg-secondary/90 text-white",
        badgeClass: "bg-secondary text-white",
        Icon: Zap,
      },
    },
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const priceKey = `${planId}_${billingCycle}`;
    setIsLoading(planId);
    
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
      setIsLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-14 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-5">
            <Star className="w-4 h-4 text-accent" />
            <span className="text-accent-foreground text-xs sm:text-sm font-semibold">{t("pricing.badge")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("pricing.title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            {t("pricing.subtitle")}
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
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Plan Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
            const IconComponent = plan.style.Icon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 ${plan.style.border} ${plan.style.bg} p-6 transition-all hover:shadow-lg`}
              >
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={`${plan.style.badgeClass} shadow-lg px-3 py-1 text-xs font-semibold`}>
                    {plan.hasTrial ? (
                      <>
                        <Gift className="w-3 h-3 mr-1" />
                        {t("pricing.trialBadge", { days: plan.trialDays })}
                      </>
                    ) : plan.popular ? (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t("pricing.popular")}
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        PREMIUM
                      </>
                    )}
                  </Badge>
                </div>

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mt-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${plan.style.iconBg} flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 ${plan.style.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.hasTrial && billingCycle === "monthly" ? "0€" : `${price.toFixed(2).replace(".", ",")}€`}
                    </span>
                    <span className="text-muted-foreground text-sm">{t("pricing.perMonth")}</span>
                  </div>
                  {plan.hasTrial && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("pricing.thenPrice", { price: `${price.toFixed(2).replace(".", ",")}€` })}
                    </p>
                  )}
                  {billingCycle === "yearly" && !plan.hasTrial && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("pricing.billedYearly", { price: `${(plan.priceYearly * 12).toFixed(0)}€` })}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading === plan.id}
                  className={`w-full rounded-xl h-12 font-semibold ${plan.style.buttonClass} shadow-lg`}
                >
                  {isLoading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {plan.hasTrial ? t("pricing.startTrial") : t("pricing.choosePlan")}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-4 mt-8 text-xs text-muted-foreground">
          <span>{t("pricing.cancelAnytime")}</span>
          <span>•</span>
          <span>{t("pricing.noCreditCard")}</span>
        </div>
      </div>
    </section>
  );
};
