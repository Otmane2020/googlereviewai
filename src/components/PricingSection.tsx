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
    ],
    popular: true,
    planId: "pro",
  },
  {
    name: "Business",
    price: "99€",
    credits: 400,
    maxBusinesses: -1,
    features: [
      "400 crédits (réponses IA)",
      "Établissements illimités",
      "IA premium + AEO",
      "API & webhooks",
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
    <section id="pricing" className="py-16 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-primary text-xs sm:text-sm font-medium">Tarification simple</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Payez uniquement ce que vous utilisez
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2">
            1 crédit = 1 réponse IA. Rechargez à tout moment.
          </p>
        </div>

        {/* Pricing cards - Mobile scroll or stack */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/5 to-card border-primary/30 shadow-xl shadow-primary/10 sm:scale-105"
                  : "bg-card border-border shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 sm:px-4 sm:py-1.5 bg-primary text-primary-foreground text-xs sm:text-sm font-medium rounded-full shadow-lg">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> Recommandé
                  </span>
                </div>
              )}

              <div className="text-center mb-5 sm:mb-6 md:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-3 sm:mt-4">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                </div>
                <div className="mt-2 sm:mt-3 flex items-center justify-center gap-3 sm:gap-4">
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                    {plan.credits}
                  </span>
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
                    {plan.maxBusinesses === -1 ? "∞" : plan.maxBusinesses}
                  </span>
                </div>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full mb-5 sm:mb-6 md:mb-8 h-10 sm:h-11"
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Commencer
              </Button>

              <ul className="space-y-2.5 sm:space-y-3 md:space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Recharge section - Mobile optimized */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              Rechargez vos crédits
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Rechargez quand vous voulez
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.credits}
                className={`bg-card p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border text-center transition-all hover:shadow-lg ${
                  pack.popular ? "border-primary shadow-md" : "border-border"
                }`}
              >
                {pack.popular && (
                  <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-medium rounded-full mb-2 sm:mb-3">
                    Populaire
                  </span>
                )}
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-accent" />
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{pack.credits}</span>
                </div>
                <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">crédits</p>
                <p className="text-base sm:text-lg md:text-2xl font-bold text-foreground mb-1">{pack.price}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 md:mb-4">{pack.pricePerCredit}/cr</p>
                <Button 
                  variant={pack.popular ? "default" : "outline"} 
                  className="w-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm" 
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
