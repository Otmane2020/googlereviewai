import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanCard } from "@/components/PlanCard";
import { 
  Crown, 
  Loader2,
  Shield,
  Sparkles,
  LogOut
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
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    priceYearly: 950.40,
    credits: 400,
    businesses: "Illimité",
    features: ["Tout Pro +", "SEO AutoPost", "API access", "Support prioritaire"],
  },
];

const SelectPlan = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoadingLogout(false);
    }
  };

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <StarlinkoLogo showBadge={false} />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loadingLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            {loadingLogout ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-primary/30">
            <Crown className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Choisissez <span className="text-primary">votre plan</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Commencez avec 3 jours d'essai gratuit
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isYearly ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  isYearly ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Annuel
            </span>
            {isYearly && (
              <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs">
                -20%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Stack */}
        <div className="space-y-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isYearly={isYearly}
              isLoading={loadingPlan === plan.id}
              onSelect={() => handleSelectPlan(plan)}
            />
          ))}
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Paiement 100% sécurisé</span>
          <Shield className="w-3 h-3 text-secondary" />
        </div>

        {/* Legal links */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          En continuant, vous acceptez nos{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Conditions
          </Link>{" "}
          et{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Confidentialité
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SelectPlan;
