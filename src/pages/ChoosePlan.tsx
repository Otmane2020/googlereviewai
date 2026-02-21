import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, LogOut, ShieldCheck, Clock, Loader2, Gift } from "lucide-react";
import { TrustAvisCarousel } from "@/components/TrustAvisBadge";
import { CountdownBar } from "@/components/CountdownBar";
import { PlanCard } from "@/components/PlanCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 2.99,
    priceYearly: 2.39,
    credits: 30,
    businesses: "1",
    features: ["Réponses IA aux avis Google", "30 crédits/mois", "1 établissement"],
    hasTrial: true,
    trialDays: 3,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29.99,
    priceYearly: 23.99,
    credits: 100,
    businesses: "2",
    features: ["Tout Starter +", "100 crédits/mois", "2 établissements", "Articles SEO"],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    priceYearly: 79.20,
    credits: 300,
    businesses: "10",
    features: ["Tout Pro +", "300 crédits/mois", "10 établissements", "AEO ChatGPT", "Support prioritaire"],
  },
];

const ChoosePlan = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSelectPlan = async (planId: string) => {
    setIsProcessing(true);
    setLoadingPlanId(planId);
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
      setLoadingPlanId(null);
    }
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
    <div className="min-h-screen bg-background safe-area-insets">
      <CountdownBar hoursFromNow={4} />
      <Helmet>
        <title>Tarifs & Abonnements | Starlinko - Gestion Avis Google</title>
        <meta 
          name="description" 
          content="Choisissez le plan Starlinko adapté à votre entreprise. Essai gratuit 3 jours, à partir de 2,99€/mois. Automatisez vos avis Google avec l'IA." 
        />
        <meta name="keywords" content="tarifs starlinko, prix avis google, abonnement gestion avis, essai gratuit" />
        <link rel="canonical" href="https://starlinko.app/select-plan" />
        
        <meta property="og:title" content="Tarifs Starlinko - Gestion des Avis Google" />
        <meta property="og:description" content="Plans à partir de 2,99€/mois. Essai gratuit 3 jours." />
        <meta property="og:url" content="https://starlinko.app/select-plan" />
        <meta property="og:type" content="website" />
      </Helmet>

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

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Mensuel
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors border-2 ${
              isYearly 
                ? "bg-primary border-primary" 
                : "bg-muted border-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-transform ${
                isYearly 
                  ? "translate-x-7 bg-primary-foreground" 
                  : "translate-x-1 bg-primary"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Annuel
          </span>
        </div>

        {/* Plan Cards */}
        <div className="space-y-6">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isYearly={isYearly}
              isLoading={isProcessing && loadingPlanId === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            Paiement sécurisé
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            Annulation immédiate
          </span>
        </div>

        {/* TrustAvis */}
        <div className="mt-6">
          <TrustAvisCarousel />
        </div>
      </main>
      
      {/* Sticky TrustAvis Rating */}
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="https://trust-avis.com/entreprise/starlinko"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-lg text-sm hover:shadow-xl transition-all"
        >
          <div className="w-4 h-4 bg-[#3B82F6] rounded flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-white fill-white" />
          </div>
          <span className="font-medium">
            <span className="text-foreground">Trust</span>
            <span className="text-[#3B82F6]">Avis</span>
          </span>
          <span className="text-muted-foreground">4.8</span>
        </a>
      </div>
    </div>
  );
};

export default ChoosePlan;
