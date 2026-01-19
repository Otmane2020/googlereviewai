import { Button } from "./ui/button";
import { Check, Zap, Star, Battery, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const subscriptionPlans = [
  { 
    name: "Starter", 
    credits: 10, 
    price: "2,99€", 
    businesses: "1 établissement",
    icon: Battery,
    features: ["10 crédits IA", "1 établissement", "Réponses personnalisées", "Support email"]
  },
  { 
    name: "Pro", 
    credits: 100, 
    price: "29,99€", 
    businesses: "2 établissements",
    popular: true, 
    icon: Zap,
    features: ["100 crédits IA", "2 établissements", "Réponses personnalisées", "Support prioritaire", "Statistiques avancées"]
  },
  { 
    name: "Business", 
    credits: 400, 
    price: "99€", 
    businesses: "Illimité",
    icon: Crown,
    features: ["400 crédits IA", "Établissements illimités", "Réponses personnalisées", "Support dédié", "Statistiques avancées", "API access"]
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();

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
          <p className="text-muted-foreground text-sm sm:text-base">
            1 crédit = 1 réponse IA générée pour vos avis Google
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {subscriptionPlans.map((plan) => (
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
                <span className="text-2xl sm:text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/mois</span>
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
                onClick={() => navigate("/auth")}
              >
                Commencer
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
