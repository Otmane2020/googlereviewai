import { Button } from "./ui/button";
import { Check, Zap, Building2, Coins, Sparkles, Star, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    emoji: "🚀",
    price: "2,99€",
    period: "one-time",
    credits: 10,
    maxBusinesses: 1,
    features: [
      "10 crédits IA",
      "1 établissement",
      "Réponses personnalisées",
      "Tableau de bord",
    ],
    popular: false,
    planId: "starter",
  },
  {
    name: "Pro",
    emoji: "⭐",
    price: "29,99€",
    period: "one-time",
    credits: 100,
    maxBusinesses: 2,
    features: [
      "100 crédits IA",
      "2 établissements",
      "SEO AutoPost inclus",
      "Support prioritaire",
      "Statistiques avancées",
    ],
    popular: true,
    planId: "pro",
  },
  {
    name: "Business",
    emoji: "👑",
    price: "99€",
    period: "one-time",
    credits: 400,
    maxBusinesses: -1,
    features: [
      "400 crédits IA",
      "Établissements illimités",
      "AEO ChatGPT Rank",
      "Publication auto",
      "Manager dédié",
    ],
    popular: false,
    planId: "business",
  },
];

const creditPacks = [
  { credits: 10, price: "2,99€", emoji: "🔋" },
  { credits: 100, price: "24,99€", popular: true, emoji: "⚡" },
  { credits: 400, price: "79€", emoji: "🔥" },
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-14 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-5">
            <Coins className="w-4 h-4 text-accent" />
            <span className="text-accent-foreground text-xs sm:text-sm font-semibold">Tarifs transparents</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Payez ce que vous utilisez
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            1 crédit = 1 réponse IA générée. Sans engagement, rechargez quand vous voulez.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/10 to-card border-primary/40 shadow-xl ring-2 ring-primary/20"
                  : "bg-card border-border shadow-md hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                    <Star className="w-3.5 h-3.5 fill-current" /> Recommandé
                  </span>
                </div>
              )}

              <div className="text-center mb-5">
                <span className="text-2xl sm:text-3xl mb-2 block">{plan.emoji}</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{plan.price}</span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Coins className="w-3.5 h-3.5 text-accent" />
                    {plan.credits} crédits
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Building2 className="w-3.5 h-3.5 text-secondary" />
                    {plan.maxBusinesses === -1 ? "∞" : plan.maxBusinesses} établ.
                  </span>
                </div>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full mb-5 h-11"
                onClick={() => navigate("/auth")}
              >
                {plan.popular ? "Choisir Pro" : "Commencer"}
              </Button>

              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-secondary" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Recharge section */}
        <div className="bg-gradient-to-br from-accent/5 via-background to-primary/5 rounded-2xl p-5 sm:p-8 border border-border/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Rechargez vos crédits</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Plus vous achetez, moins vous payez par crédit
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {creditPacks.map((pack) => (
              <div
                key={pack.credits}
                className={`bg-card p-4 sm:p-5 rounded-xl border text-center transition-all hover:shadow-lg ${
                  pack.popular ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border"
                }`}
              >
                <span className="text-xl sm:text-2xl mb-2 block">{pack.emoji}</span>
                {pack.popular && (
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full mb-2">
                    -17%
                  </span>
                )}
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-lg sm:text-2xl font-bold text-foreground">{pack.credits}</span>
                </div>
                <p className="text-muted-foreground text-xs mb-2">crédits</p>
                <p className="text-base sm:text-xl font-bold text-foreground mb-3">{pack.price}</p>
                <Button 
                  variant={pack.popular ? "default" : "outline"} 
                  className="w-full h-9 text-xs" 
                  onClick={() => navigate("/auth")}
                >
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
