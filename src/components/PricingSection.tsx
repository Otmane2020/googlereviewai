import { Button } from "./ui/button";
import { Check, Star, Shield, Lock, FileCheck, Zap, Target, Sparkles } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    subtitle: "Découverte",
    monthlyPrice: "9,90€",
    yearlyPrice: "7,90€",
    features: [
      "1 établissement Google My Business",
      "50 avis/réponses automatiques par mois",
      "Réponses IA basiques (GPT-4)",
      "Alertes email sur nouveaux avis",
      "Tableau de bord basique",
      "Accès API Google My Business vérifié",
    ],
    popular: false,
  },
  {
    name: "Pro",
    subtitle: "Visibilité",
    monthlyPrice: "29,90€",
    yearlyPrice: "23,90€",
    features: [
      "Jusqu'à 3 établissements Google My Business",
      "300 avis/réponses automatiques par mois",
      "Réponses IA premium (GPT-4.1)",
      "Notifications temps réel",
      "Statistiques avancées",
      "Support prioritaire",
      "API Google My Business complète",
    ],
    popular: true,
  },
  {
    name: "Business",
    subtitle: "Performance",
    monthlyPrice: "79,90€",
    yearlyPrice: "63,90€",
    features: [
      "Établissements Google My Business illimités",
      "1000 avis/réponses automatiques par mois",
      "IA premium + posts automatiques",
      "API & webhooks avancés",
      "Manager dédié",
      "Rapports personnalisés",
      "Accès API Business Profile complet",
    ],
    popular: false,
  },
];

const securityBadges = [
  { icon: Check, label: "Application vérifiée Google" },
  { icon: Lock, label: "Données chiffrées OAuth 2.0" },
  { icon: FileCheck, label: "Conforme aux politiques API" },
  { icon: Zap, label: "Accès API Business Profile" },
  { icon: Sparkles, label: "Synchronisation temps réel" },
  { icon: Target, label: "Scopes d'accès limités" },
];

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tarifs avec accès API vérifié
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-secondary" /> Application vérifiée Google
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-secondary" /> Conforme aux politiques
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-secondary" /> 14 jours d'essai gratuit
            </span>
          </div>
          
          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 bg-muted rounded-full p-1.5">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly ? "bg-card shadow-md text-foreground" : "text-muted-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly ? "bg-card shadow-md text-foreground" : "text-muted-foreground"
              }`}
            >
              Annuel
              <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                -20%
              </span>
            </button>
          </div>
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
                    <Star className="w-4 h-4 fill-current" /> Plus populaire
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.subtitle}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <p className="text-xs text-secondary mt-2">Accès API Google vérifié</p>
              </div>

              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full mb-8"
                size="lg"
              >
                Essayer gratuitement
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

        {/* Security badges */}
        <div className="bg-muted/50 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-foreground text-center mb-6">
            🛡️ Conformité et Sécurité
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {securityBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border text-center"
              >
                <badge.icon className="w-6 h-6 text-secondary" />
                <span className="text-xs text-muted-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
