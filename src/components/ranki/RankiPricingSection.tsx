import { useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BrandSparkle } from "@/components/BrandSparkle";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  priceKey: string;
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Découverte",
    price: "9,90€",
    period: "/mois",
    features: [
      "1 établissement Google My Business",
      "50 avis/réponses automatiques par mois",
      "Réponses IA basiques (GPT-4)",
      "Alertes email sur nouveaux avis",
      "Tableau de bord basique",
      "Accès API Google My Business vérifié",
    ],
    cta: "Essayer gratuitement",
    priceKey: "ranki_starter",
  },
  {
    name: "Pro",
    tagline: "Visibilité",
    price: "29,90€",
    period: "/mois",
    features: [
      "Jusqu'à 3 établissements Google My Business",
      "300 avis/réponses automatiques par mois",
      "Réponses IA premium (GPT-4.1)",
      "Notifications temps réel",
      "Statistiques avancées",
      "Support prioritaire",
      "API Google My Business complète",
    ],
    cta: "Essayer gratuitement",
    highlight: true,
    priceKey: "ranki_pro",
  },
  {
    name: "Business",
    tagline: "Performance",
    price: "79,90€",
    period: "/mois",
    features: [
      "Établissements Google My Business illimités",
      "1000 avis/réponses automatiques par mois",
      "IA premium + posts automatiques",
      "API & webhooks avancés",
      "Manager dédié",
      "Rapports personnalisés",
      "Accès API Business Profile complet",
    ],
    cta: "Essayer gratuitement",
    priceKey: "ranki_business",
  },
];

export const RankiPricingSection = () => {
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleCta = async (plan: Plan) => {
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
            7 jours d'essai gratuit sur tous les plans. Sans engagement, résiliable à tout moment.
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
                    <BrandSparkle className="w-3 h-3" /> Le plus populaire
                  </div>
                )}

                <h3 className={`text-lg font-bold ${p.highlight ? "text-background" : "text-foreground"}`}>
                  {p.name}
                </h3>
                <p className={`text-sm ${p.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                  {p.tagline}
                </p>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${p.highlight ? "text-background" : "text-foreground"}`}>
                    {p.price}
                  </span>
                  <span className={`text-sm ${p.highlight ? "text-background/90" : "text-muted-foreground"}`}>
                    {p.period}
                  </span>
                </div>

                <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${p.highlight ? "text-background/90" : "text-primary"}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Accès API Google vérifié
                </div>

                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.highlight ? "text-background" : "text-primary"}`} />
                      <span className={p.highlight ? "text-background/95" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <Button
                    size="lg"
                    variant={p.highlight ? "secondary" : "outline"}
                    className="w-full font-semibold"
                    onClick={() => handleCta(p)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : p.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Paiement sécurisé Stripe • TVA incluse • Résiliation en 1 clic
        </p>
      </div>
    </section>
  );
};
