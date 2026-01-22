import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Building2, ArrowRight, LogOut, Sparkles } from "lucide-react";

const USE_CASES = [
  {
    id: "reviews",
    icon: Star,
    title: "Gérer mes avis Google automatiquement",
    subtitle: "Plus besoin de répondre manuellement",
    badge: null,
    plan: {
      priceKey: "starter_monthly",
      name: "Starlinko Starter",
      price: 2.99,
      description: "30 crédits IA/mois • 1 établissement",
    },
    modules: [],
    gradient: "from-blue-500/10 to-blue-600/10",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
  },
  {
    id: "visibility",
    icon: TrendingUp,
    title: "Être visible dans ChatGPT & Google AI",
    subtitle: "Soyez cité comme source fiable",
    badge: "Recommandé ⭐",
    plan: {
      priceKey: "pro_monthly",
      name: "Starlinko Pro",
      price: 29.99,
      description: "100 crédits IA/mois • 2 établissements",
    },
    modules: [
      {
        priceKey: "aeo_monthly",
        name: "ChatGPT Rank (AEO)",
        price: 49,
        description: "1 Q&A/jour pour IA",
      },
    ],
    gradient: "from-secondary/10 to-primary/10",
    borderColor: "border-secondary/50 hover:border-secondary",
  },
  {
    id: "scale",
    icon: Building2,
    title: "Dominer ma zone (Multi-établissements)",
    subtitle: "Solution complète pour les franchises",
    badge: "Premium",
    plan: {
      priceKey: "business_monthly",
      name: "Starlinko Business",
      price: 99,
      description: "300 crédits IA/mois • 10 établissements",
    },
    modules: [
      {
        priceKey: "aeo_monthly",
        name: "ChatGPT Rank (AEO)",
        price: 49,
        description: "1 Q&A/jour par établissement",
      },
      {
        priceKey: "seo_monthly",
        name: "SEO AutoPost",
        price: 49,
        description: "1 article SEO/jour",
      },
    ],
    gradient: "from-accent/10 to-orange-500/10",
    borderColor: "border-accent/50 hover:border-accent",
  },
];

const ChoosePlan = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { addItem, clearCart, setBillingCycle } = useCart();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSelectUseCase = (useCase: (typeof USE_CASES)[0]) => {
    // Clear cart and set billing cycle
    clearCart();
    setBillingCycle("monthly");

    // Add the plan
    addItem({
      type: "plan",
      priceKey: useCase.plan.priceKey,
      name: useCase.plan.name,
      description: useCase.plan.description,
      price: useCase.plan.price,
      quantity: 1,
      isRecurring: true,
      interval: "month",
    });

    // Add pre-selected modules
    useCase.modules.forEach((module) => {
      addItem({
        type: "module",
        priceKey: module.priceKey,
        name: module.name,
        description: module.description,
        price: module.price,
        quantity: 1,
        isRecurring: true,
        interval: "month",
      });
    });

    // Navigate to checkout
    navigate("/checkout");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 safe-area-insets">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <StarlinkoLogo />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Bienvenue sur Starlinko
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Que voulez-vous accomplir ?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choisissez votre objectif principal et nous configurerons votre solution idéale
          </p>
        </div>

        {/* Use Case Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {USE_CASES.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <Card
                key={useCase.id}
                className={`relative overflow-hidden transition-all duration-300 cursor-pointer bg-gradient-to-br ${useCase.gradient} ${useCase.borderColor} border-2`}
                onClick={() => handleSelectUseCase(useCase)}
              >
                {useCase.badge && (
                  <Badge
                    className={`absolute top-4 right-4 ${
                      useCase.badge.includes("Recommandé")
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {useCase.badge}
                  </Badge>
                )}

                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center mb-4 shadow-md">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl leading-tight">{useCase.title}</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">{useCase.subtitle}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Plan included */}
                  <div className="bg-card/60 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{useCase.plan.name}</span>
                      <span className="font-bold text-primary">{useCase.plan.price}€/mois</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{useCase.plan.description}</p>
                  </div>

                  {/* Modules pre-selected */}
                  {useCase.modules.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        + Options incluses
                      </span>
                      {useCase.modules.map((module) => (
                        <div
                          key={module.priceKey}
                          className="flex items-center justify-between text-sm bg-card/40 rounded p-2"
                        >
                          <span className="text-foreground">{module.name}</span>
                          <span className="text-muted-foreground">+{module.price}€</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Button className="w-full group" variant={useCase.badge?.includes("Recommandé") ? "default" : "secondary"}>
                    Choisir
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            🎁 Essai gratuit 3 jours sur le plan Starter • 🔒 Paiement sécurisé par Stripe • ❌ Annulation en 1 clic
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChoosePlan;
