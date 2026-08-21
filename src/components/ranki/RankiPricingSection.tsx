import { useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BrandSparkle } from "@/components/BrandSparkle";

type Billing = "monthly" | "yearly";

type Plan = {
  name: string;
  tagline: string;
  monthly: { price: string; priceKey: string; perMonth: string };
  yearly: { price: string; priceKey: string; perMonth: string };
  features: string[];
  cta: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Avis Google",
    monthly: { price: "9,99€", perMonth: "/mois", priceKey: "ranki_starter_monthly" },
    yearly: { price: "95,90€", perMonth: "/an", priceKey: "ranki_starter_yearly" },
    features: [
      "1 établissement Google My Business",
      "Réponses IA automatiques 24/7 aux avis Google",
      "Alertes email & push sur nouveaux avis",
      "Tableau de bord avis",
      "Accès API Google Business vérifié",
    ],
    cta: "Essayer 7 jours gratuits",
  },
  {
    name: "Pro",
    tagline: "Avis + GEO + SEO/AEO automatiques",
    monthly: { price: "49€", perMonth: "/mois", priceKey: "ranki_pro_monthly" },
    yearly: { price: "470€", perMonth: "/an", priceKey: "ranki_pro_yearly" },
    features: [
      "Jusqu'à 3 établissements",
      "Réponses IA illimitées aux avis Google",
      "GEO Rank quotidien (suivi positionnement Maps)",
      "Posts SEO + Q&R AEO publiés automatiquement",
      "Notifications temps réel",
      "Support prioritaire",
    ],
    cta: "Essayer 7 jours gratuits",
    highlight: true,
  },
  {
    name: "Business",
    tagline: "Multi-établissements illimités",
    monthly: { price: "99€", perMonth: "/mois", priceKey: "ranki_business_monthly" },
    yearly: { price: "950,40€", perMonth: "/an", priceKey: "ranki_business_yearly" },
    features: [
      "Établissements illimités",
      "Réponses IA illimitées + GEO + SEO/AEO",
      "Posts & Q&R automatiques illimités",
      "API & webhooks avancés",
      "Manager dédié",
      "Rapports personnalisés",
    ],
    cta: "Essayer 7 jours gratuits",
  },
];

export const RankiPricingSection = () => {
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [billing, setBilling] = useState<Billing>("monthly");

  const handleCta = async (plan: Plan) => {
    const priceKey = billing === "yearly" ? plan.yearly.priceKey : plan.monthly.priceKey;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem("pending_price_key", priceKey);
      navigate(`/auth?redirect=checkout&priceKey=${priceKey}`);
      return;
    }

    setLoadingKey(priceKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
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
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Une tarification simple. <span className="text-primary">Une visibilité IA massive.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            7 jours d'essai gratuit sur tous les plans. Sans engagement, résiliable à tout moment.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center p-1 rounded-full bg-muted border border-border">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                billing === "monthly" ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all inline-flex items-center gap-2 ${
                billing === "yearly" ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => {
            const tier = billing === "yearly" ? p.yearly : p.monthly;
            const isLoading = loadingKey === tier.priceKey;
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
                    {tier.price}
                  </span>
                  <span className={`text-sm ${p.highlight ? "text-background/90" : "text-muted-foreground"}`}>
                    {tier.perMonth}
                  </span>
                </div>

                {billing === "yearly" && (
                  <div className={`mt-1 text-xs ${p.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                    Soit {(parseFloat(tier.price.replace(",", ".").replace("€", "")) / 12).toFixed(2).replace(".", ",")}€/mois
                  </div>
                )}

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
