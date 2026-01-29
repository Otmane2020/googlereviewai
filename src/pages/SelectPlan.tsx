import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Gift, 
  Star,
  Crown, 
  Loader2,
  Shield,
  Sparkles,
  LogOut,
  Check,
  FileText,
  MessageSquare
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  businesses: string;
  badge?: string;
  badgeColor?: string;
  cardColor?: string;
  iconColor?: string;
  icon: React.ElementType;
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
    businesses: "1 établissement",
    badge: "ESSAI 3 JOURS",
    badgeColor: "bg-emerald-500",
    cardColor: "from-emerald-50 to-emerald-100 border-emerald-300",
    iconColor: "bg-emerald-500",
    icon: Gift,
    hasTrial: true,
    trialDays: 3,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29.99,
    priceYearly: 287.90,
    credits: 100,
    businesses: "2 établissements",
    badge: "POPULAIRE",
    badgeColor: "bg-rose-500",
    cardColor: "from-rose-50 to-rose-100 border-rose-300",
    iconColor: "bg-rose-400",
    icon: Star,
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    priceYearly: 950.40,
    credits: 400,
    businesses: "Illimité",
    badge: "ENTREPRISE",
    badgeColor: "bg-violet-500",
    cardColor: "from-violet-50 to-violet-100 border-violet-300",
    iconColor: "bg-violet-500",
    icon: Crown,
  },
];

const SelectPlan = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  
  // Module toggles
  const [seoEnabled, setSeoEnabled] = useState(false);
  const [aeoEnabled, setAeoEnabled] = useState(false);

  const MODULE_PRICE_MONTHLY = 49;
  const MODULE_PRICE_YEARLY = 470.40;

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_name, subscription_status")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentPlanName(profile.plan_name?.toLowerCase() || null);
        setSubscriptionStatus(profile.subscription_status);
      }
    };

    fetchCurrentPlan();
  }, [user]);

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

  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  const handleSelectPlan = async (plan: Plan) => {
    const priceKey = `${plan.id}_${isYearly ? "yearly" : "monthly"}`;
    setLoadingPlan(priceKey);

    try {
      // Build line items array
      const lineItems: string[] = [priceKey];
      
      if (seoEnabled) {
        lineItems.push(`seo_autopost_${isYearly ? "yearly" : "monthly"}`);
      }
      if (aeoEnabled) {
        lineItems.push(`aeo_rank_${isYearly ? "yearly" : "monthly"}`);
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey,
          lineItems: lineItems.length > 1 ? lineItems : undefined,
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
        description: "Impossible de lancer le paiement. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getModulesTotal = () => {
    let total = 0;
    if (seoEnabled) total += isYearly ? MODULE_PRICE_YEARLY : MODULE_PRICE_MONTHLY;
    if (aeoEnabled) total += isYearly ? MODULE_PRICE_YEARLY : MODULE_PRICE_MONTHLY;
    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-rose-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <StarlinkoLogo showBadge={false} />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loadingLogout}
            className="text-muted-foreground"
          >
            {loadingLogout ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-1" />
                Déconnexion
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">
            Choisissez <span className="text-rose-500">votre plan</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Automatisez vos réponses aux avis Google
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Mensuel
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isYearly ? "bg-emerald-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                isYearly ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Annuel
          </span>
          {isYearly && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
              -20%
            </span>
          )}
        </div>

        {/* Plans */}
        <div className="space-y-4 mb-6">
          {plans.map((plan) => {
            const priceKey = `${plan.id}_${isYearly ? "yearly" : "monthly"}`;
            const isCurrentPlan = currentPlanName === plan.id.toLowerCase() && 
              (subscriptionStatus === "active" || subscriptionStatus === "trialing");
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            const period = isYearly ? "/an" : "/mois";
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative bg-gradient-to-br ${plan.cardColor} rounded-2xl p-5 border-2 shadow-sm`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 ${plan.badgeColor} text-white text-xs font-bold rounded-full shadow-md`}>
                      {plan.id === "starter" && <Gift className="w-3 h-3" />}
                      {plan.id === "pro" && <Star className="w-3 h-3" />}
                      {plan.id === "business" && <Crown className="w-3 h-3" />}
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${plan.iconColor} flex items-center justify-center shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.credits} crédits • {plan.businesses}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">{price.toFixed(2)}€</span>
                    <span className="text-sm text-muted-foreground">{period}</span>
                    {plan.hasTrial && (
                      <p className="text-xs text-emerald-600 font-medium">3 jours gratuits</p>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full mt-4 ${
                    plan.id === "starter" 
                      ? "bg-emerald-500 hover:bg-emerald-600" 
                      : plan.id === "pro"
                      ? "bg-rose-500 hover:bg-rose-600"
                      : "bg-violet-500 hover:bg-violet-600"
                  } text-white font-semibold`}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan === priceKey || isCurrentPlan}
                >
                  {loadingPlan === priceKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Plan actuel
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {plan.hasTrial ? "Commencer l'essai" : `Choisir ${plan.name}`}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Modules Add-ons */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Modules Premium
          </h3>

          {/* SEO AutoPost */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">SEO AutoPost</p>
                <p className="text-xs text-muted-foreground">1 article SEO/jour</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                +{isYearly ? MODULE_PRICE_YEARLY.toFixed(0) : MODULE_PRICE_MONTHLY}€{isYearly ? "/an" : "/mois"}
              </span>
              <Switch checked={seoEnabled} onCheckedChange={setSeoEnabled} />
            </div>
          </div>

          {/* AEO Rank */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">ChatGPT Rank (AEO)</p>
                <p className="text-xs text-muted-foreground">1 Q&A optimisé/jour</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                +{isYearly ? MODULE_PRICE_YEARLY.toFixed(0) : MODULE_PRICE_MONTHLY}€{isYearly ? "/an" : "/mois"}
              </span>
              <Switch checked={aeoEnabled} onCheckedChange={setAeoEnabled} />
            </div>
          </div>

          {/* Total if modules selected */}
          {(seoEnabled || aeoEnabled) && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Modules sélectionnés</span>
                <span className="font-bold text-foreground">
                  +{getModulesTotal().toFixed(2)}€{isYearly ? "/an" : "/mois"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Paiement 100% sécurisé</span>
          <Shield className="w-4 h-4 text-emerald-500" />
        </div>

        {/* Legal links */}
        <div className="text-center mt-4 text-xs text-muted-foreground">
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
