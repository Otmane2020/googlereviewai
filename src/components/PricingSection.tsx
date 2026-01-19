import { Button } from "./ui/button";
import { Check, Zap, Building2, Coins, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "2,99€",
    credits: 10,
    maxBusinesses: 1,
    features: [
      "10 crédits (réponses IA)",
      "1 établissement",
      "Réponses IA personnalisées",
      "Tableau de bord",
      "Historique des avis",
    ],
    popular: false,
    planId: "starter",
  },
  {
    name: "Pro",
    price: "29,99€",
    credits: 100,
    maxBusinesses: 2,
    features: [
      "100 crédits (réponses IA)",
      "2 établissements",
      "Réponses IA premium",
      "SEO AutoPost inclus",
      "Support prioritaire",
      "Statistiques avancées",
    ],
    popular: true,
    planId: "pro",
  },
  {
    name: "Business",
    price: "99€",
    credits: 400,
    maxBusinesses: -1, // unlimited
    features: [
      "400 crédits (réponses IA)",
      "Établissements illimités",
      "IA premium + AEO",
      "API & webhooks",
      "Manager dédié",
      "Publication auto Google",
    ],
    popular: false,
    planId: "business",
  },
];

const creditPacks = [
  { credits: 10, price: "2,99€", pricePerCredit: "0,30€" },
  { credits: 100, price: "24,99€", pricePerCredit: "0,25€", popular: true },
  { credits: 400, price: "79€", pricePerCredit: "0,20€" },
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">Tarification simple</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Payez uniquement ce que vous utilisez
          </h2>
          <p className="text-lg text-muted-foreground">
            1 crédit = 1 réponse IA générée. Rechargez à tout moment, même si vous n'avez pas épuisé vos crédits.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/5 to-card border-primary/30 shadow-xl shadow-primary/10 scale-105"
                  : "bg-card border-border shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg">
                    <Sparkles className="w-4 h-4" /> Recommandé
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Coins className="w-4 h-4 text-accent" />
                    {plan.credits} crédits
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 text-secondary" />
                    {plan.maxBusinesses === -1 ? "∞" : plan.maxBusinesses} établ.
                  </span>
                </div>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full mb-8"
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Commencer
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Recharge section */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              <Zap className="inline w-6 h-6 text-accent mr-2" />
              Rechargez vos crédits à tout moment
            </h3>
            <p className="text-muted-foreground">
              Comme sur Lovable, rechargez quand vous voulez, même si votre solde n'est pas à zéro
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.credits}
                className={`bg-card p-6 rounded-2xl border text-center transition-all hover:shadow-lg ${
                  pack.popular ? "border-primary shadow-md" : "border-border"
                }`}
              >
                {pack.popular && (
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3">
                    Meilleur rapport
                  </span>
                )}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-6 h-6 text-accent" />
                  <span className="text-3xl font-bold text-foreground">{pack.credits}</span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">crédits</p>
                <p className="text-2xl font-bold text-foreground mb-1">{pack.price}</p>
                <p className="text-xs text-muted-foreground mb-4">{pack.pricePerCredit}/crédit</p>
                <Button variant={pack.popular ? "default" : "outline"} className="w-full" onClick={() => navigate("/auth")}>
                  Acheter
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
