import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Star, Zap, Building2, LogOut, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 2.99,
    priceYearly: 28.70,
    credits: 30,
    businesses: "1",
    badge: "ESSAI 3 JOURS",
    icon: Star,
    hasTrial: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29.99,
    priceYearly: 287.90,
    credits: 100,
    businesses: "2",
    badge: "POPULAIRE",
    icon: Zap,
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    priceYearly: 950.40,
    credits: 300,
    businesses: "10",
    badge: "PRO",
    icon: Building2,
  },
];

const ChoosePlan = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSelectPlan = async (planId: string) => {
    setIsProcessing(true);
    try {
      const priceKey = `${planId}_${isYearly ? "yearly" : "monthly"}`;
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceKey },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Erreur lors du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };


  // No profile-based current plan check for now
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-insets">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <StarlinkoLogo />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground mb-1">Choisissez votre plan</h1>
          <p className="text-sm text-muted-foreground">Annulez à tout moment</p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Mensuel
          </span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={`text-sm ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Annuel
          </span>
          {isYearly && (
            <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground">
              -20%
            </Badge>
          )}
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            
            return (
              <div
                key={plan.id}
                className="relative rounded-xl border-2 border-border bg-card hover:border-primary/50 p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{plan.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {plan.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.credits} crédits • {plan.businesses} établ.
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-bold text-foreground">
                      {price.toFixed(2)}€
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      /{isYearly ? "an" : "mois"}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-3"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.hasTrial ? "Essai gratuit 3 jours" : "Choisir"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          🔒 Paiement sécurisé • ❌ Annulation en 1 clic
        </p>
      </main>
    </div>
  );
};

export default ChoosePlan;
