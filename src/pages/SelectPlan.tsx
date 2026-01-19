import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  Building2, 
  Loader2,
  ArrowRight,
  Shield,
  HeadphonesIcon
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  businesses: string;
  features: string[];
  popular?: boolean;
  color: string;
  hasTrial?: boolean;
  trialDays?: number;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 2.99,
    priceYearly: 28.70,
    credits: 10,
    businesses: "1",
    features: ["Réponses IA", "Sync automatique", "Support email"],
    color: "from-blue-500 to-blue-600",
    hasTrial: true,
    trialDays: 3,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29.99,
    priceYearly: 287.90,
    credits: 100,
    businesses: "2",
    features: ["Tout Starter +", "IA premium", "Priorité réponses", "Analytics"],
    popular: true,
    color: "from-primary to-primary/80",
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    priceYearly: 950.40,
    credits: 400,
    businesses: "Illimité",
    features: ["Tout Pro +", "SEO AutoPost", "API access", "Support prioritaire"],
    color: "from-violet-500 to-violet-600",
  },
];

const SelectPlan = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Redirect to auth if not logged in
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  const handleSelectPlan = async (plan: Plan) => {
    setLoadingPlan(plan.id);

    try {
      const priceKey = `${plan.id}_${isYearly ? "yearly" : "monthly"}`;
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/select-plan?canceled=true`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <Link to="/">
            <StarlinkoLogo showBadge={false} />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-8 md:mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Choisissez votre plan
          </h1>
          <p className="text-muted-foreground">
            Commencez avec 3 jours d'essai gratuit sur Starter
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  isYearly ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Annuel
            </span>
            {isYearly && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                -20%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan) => {
            const price = isYearly ? plan.priceYearly / 12 : plan.priceMonthly;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-5 md:p-6 transition-all ${
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {plan.hasTrial && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white shadow-lg">
                      🎁 {plan.trialDays} jours gratuits
                    </Badge>
                  </div>
                )}
                
                {plan.popular && !plan.hasTrial && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Populaire
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                  {plan.hasTrial && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      0€ aujourd'hui
                    </p>
                  )}
                  <div className="mt-2">
                    <span className={`text-3xl font-bold ${plan.hasTrial ? "text-muted-foreground" : "text-foreground"}`}>
                      {price.toFixed(2).replace(".", ",")}€
                    </span>
                    <span className="text-muted-foreground text-sm">/mois</span>
                  </div>
                  {plan.hasTrial && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Après {plan.trialDays} jours d'essai
                    </p>
                  )}
                  {isYearly && !plan.hasTrial && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Facturé {plan.priceYearly.toFixed(2).replace(".", ",")}€/an
                    </p>
                  )}
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-foreground">{plan.credits}</p>
                    <p className="text-[10px] text-muted-foreground">crédits</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <Building2 className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-foreground">{plan.businesses}</p>
                    <p className="text-[10px] text-muted-foreground">business</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full rounded-xl h-12 font-semibold transition-all ${
                    plan.popular
                      ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : plan.hasTrial ? (
                    <>
                      Essayer gratuitement
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Choisir ce plan
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Annuler à tout moment
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Paiement sécurisé
          </div>
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="w-4 h-4 text-green-500" />
            Support 24/7
          </div>
        </div>

        {/* Legal links */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          En continuant, vous acceptez nos{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Conditions d'utilisation
          </Link>{" "}
          et notre{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SelectPlan;
