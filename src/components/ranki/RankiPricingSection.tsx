import { useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Plan = {
  name: string;
  price: string;
  period?: string;
  desc: string;
  features: string[];
  cta: string;
  highlight: boolean;
  priceKey?: string;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "Gratuit",
    desc: "Suivez votre positionnement IA et répondez aux avis — gratuit à vie.",
    features: [
      "1 établissement",
      "Rapports GEO hebdomadaires (3 mots-clés)",
      "Réponses IA aux avis Google",
      "25 crédits gratuits / mois",
    ],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "Quotidien",
    price: "9,99€",
    period: "/mois",
    desc: "Gagnez la guerre du référencement IA en pilote automatique.",
    features: [
      "Jusqu'à 3 établissements",
      "Suivi GEO quotidien (mots-clés illimités)",
      "Posts SEO + Q&A AEO quotidiens sur Google",
      "Analyse de la concurrence",
      "Support prioritaire",
    ],
    cta: "Essai gratuit 7 jours",
    highlight: true,
    priceKey: "daily_monthly",
  },
  {
    name: "Agence",
    price: "49€",
    period: "/mois",
    desc: "Pour les marques multi-établissements et agences (10+ établissements).",
    features: [
      "Établissements illimités",
      "Suivi de consommation par établissement",
      "1000 crédits / mois (pool à allouer)",
      "Rapports en marque blanche",
      "Accès API",
      "Account manager dédié",
    ],
    cta: "Démarrer",
    highlight: false,
    priceKey: "agency_eu_monthly",
  },
];

export const RankiPricingSection = () => {
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleCta = async (plan: Plan) => {
    if (!plan.priceKey) {
      navigate("/auth");
      return;
    }

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(`/auth?redirect=checkout&priceKey=${plan.priceKey}`);
      return;
    }

    setLoadingKey(plan.priceKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey: plan.priceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/?canceled=true`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("[RankiPricing] checkout error:", e);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Une tarification simple. <span className="text-primary">Une visibilité IA massive.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Démarrez gratuitement. Passez au plan supérieur quand vous êtes prêt à dominer la recherche IA.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => {
            const isLoading = loadingKey === p.priceKey;
            return (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 border transition-all ${
                  p.highlight
                    ? "bg-foreground text-background border-foreground shadow-2xl scale-[1.02] md:scale-105"
                    : "bg-card border-border hover:shadow-xl"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background text-foreground border border-border text-xs font-bold shadow-md">
                    <Sparkles className="w-3 h-3" /> Le plus populaire
                  </div>
                )}

                <h3 className={`text-lg font-bold ${p.highlight ? "text-background" : "text-foreground"}`}>
                  {p.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${p.highlight ? "text-background" : "text-foreground"}`}>
                    {p.price}
                  </span>
                  {p.period && (
                    <span className={`text-sm ${p.highlight ? "text-background/70" : "text-muted-foreground"}`}>
                      {p.period}
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${p.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                  {p.desc}
                </p>

                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.highlight ? "text-background" : "text-primary"}`} />
                      <span className={p.highlight ? "text-background/95" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  {p.priceKey ? (
                    <Button
                      size="lg"
                      variant={p.highlight ? "secondary" : "outline"}
                      className="w-full font-semibold"
                      onClick={() => handleCta(p)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : p.cta}
                    </Button>
                  ) : (
                    <Link to="/auth" className="block">
                      <Button
                        size="lg"
                        variant={p.highlight ? "secondary" : "outline"}
                        className="w-full font-semibold"
                      >
                        {p.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
