import { Button } from "./ui/button";
import { Check, Zap, Building2, Coins, Star, FileText, MessageSquare, Eye, Battery, Flame, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatGPTIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

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

const modules = [
  {
    id: "aeo_rank",
    name: "ChatGPT Rank",
    subtitle: "Visibilité AEO",
    price: "49€",
    period: "/mois",
    icon: ChatGPTIcon,
    iconColor: "text-[#10a37f]",
    bgColor: "from-[#10a37f]/10 to-[#10a37f]/5",
    borderColor: "border-[#10a37f]/30",
    features: [
      "1 Q&A optimisé par jour",
      "Basé sur vos mots-clés",
      "Publication auto Google My Business",
      "Apparaissez dans ChatGPT & Perplexity",
      "Gestion des mots-clés illimitée",
    ],
    cta: "Activer AEO",
  },
  {
    id: "seo_autopost",
    name: "SEO AutoPost",
    subtitle: "Articles optimisés",
    price: "49€",
    period: "/mois",
    icon: GoogleIcon,
    iconColor: "text-primary",
    bgColor: "from-primary/10 to-primary/5",
    borderColor: "border-primary/30",
    features: [
      "1 article SEO par jour",
      "Optimisé pour vos mots-clés",
      "Publication auto Google My Business",
      "Dominez les recherches locales",
      "Génération automatique",
    ],
    cta: "Activer SEO",
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
            <Coins className="w-4 h-4 text-accent" />
            <span className="text-accent-foreground text-xs sm:text-sm font-semibold">Tarifs transparents</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Payez ce que vous utilisez
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Crédits pour les réponses IA + modules premium pour dominer votre marché
          </p>
        </div>

        {/* Premium Modules */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-accent" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Modules Premium</h3>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">Automatisation quotidienne pour une visibilité maximale</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`relative p-5 sm:p-6 rounded-2xl border bg-gradient-to-br ${module.bgColor} ${module.borderColor} shadow-md hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm">
                    <module.icon className={`w-6 h-6 ${module.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-foreground">{module.name}</h4>
                    <p className="text-xs text-muted-foreground">{module.subtitle}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{module.price}</span>
                  <span className="text-muted-foreground text-sm">{module.period}</span>
                </div>

                <ul className="space-y-2 mb-5">
                  {module.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-secondary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  {module.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-gradient-to-br from-accent/5 via-background to-primary/5 rounded-2xl p-5 sm:p-8 border border-border/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-accent" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Plans d'Abonnement</h3>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              1 crédit = 1 réponse IA générée pour vos avis Google
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
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
      </div>
    </section>
  );
};
