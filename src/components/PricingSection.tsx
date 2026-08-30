import { useState } from "react";
import { Button } from "./ui/button";
import { Check, Loader2, Zap, ArrowRight, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { BrandSparkle } from "@/components/BrandSparkle";

type Plan = {
  key: string;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    key: "starter_monthly",
    name: "Starter",
    price: "$9",
    tagline: "Solo locations getting started with AI visibility.",
    features: [
      "1 business location",
      "Weekly GEO rank tracking",
      "AI replies to Google reviews",
      "50 AI reply credits / month",
    ],
  },
  {
    key: "growth_monthly",
    name: "Growth",
    price: "$29",
    tagline: "Win the AI search war on autopilot.",
    features: [
      "Up to 3 locations",
      "Daily GEO rank tracking",
      "Daily AI Q&A + SEO posts",
      "200 AI credits / month",
      "Competitor share-of-voice",
      "Priority support",
    ],
    highlighted: true,
    badge: "Most popular",
  },
  {
    key: "agency_monthly",
    name: "Agency",
    price: "$79",
    tagline: "Multi-location brands and agencies.",
    features: [
      "Unlimited locations",
      "White-label reports",
      "API access",
      "Dedicated success manager",
    ],
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleSelect = async (priceKey: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoadingKey(priceKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/#pricing`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: unknown) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Paiement échoué",
        variant: "destructive",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-5">
            <BrandSparkle className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs sm:text-sm font-semibold">Simple USD pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Pick your plan. <span className="text-primary">Dominate AI search.</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg">
            Cancel anytime. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 transition-all flex flex-col ${
                plan.highlighted
                  ? "bg-foreground text-background border-2 border-foreground shadow-2xl scale-[1.02] md:scale-105"
                  : "bg-card border-2 border-border hover:shadow-xl"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-background text-foreground border border-border shadow-md px-3 py-1 text-xs font-bold">
                    <Crown className="w-3 h-3 mr-1" /> {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-5">
                <h3 className={`text-lg font-bold ${plan.highlighted ? "text-background" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-background" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                    /month
                  </span>
                </div>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-background/80" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-background" : "text-primary"}`} />
                    <span className={plan.highlighted ? "text-background/95" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelect(plan.key)}
                disabled={loadingKey === plan.key}
                size="lg"
                variant={plan.highlighted ? "secondary" : "default"}
                className="w-full font-semibold rounded-xl h-12"
              >
                {loadingKey === plan.key ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {plan.highlighted ? <Zap className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                    Choose {plan.name}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-8">
          Secure payment powered by Stripe • Cancel anytime
        </p>
      </div>
    </section>
  );
};
