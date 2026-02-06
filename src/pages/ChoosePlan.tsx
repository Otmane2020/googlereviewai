import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Star, LogOut, Check, ShieldCheck, Clock, Sparkles, Loader2, Gift } from "lucide-react";
import { TrustAvisCarousel } from "@/components/TrustAvisBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

// Single all-in-one plan - 39€/month or 390€/year
const PLAN = {
  id: "allinone",
  name: "Starlinko Tout-en-Un",
  priceMonthly: 39,
  priceYearly: 390,
  description: "Pack complet SEO + AEO + Réponses IA",
  features: [
    "Réponses IA illimitées aux avis Google",
    "Articles SEO générés automatiquement",
    "Optimisation AEO pour ChatGPT",
    "Publication automatique sur Google",
    "Tableau de bord analytics",
    "Support prioritaire",
  ],
};

const ChoosePlan = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true); // Yearly by default
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
            <Badge className="text-xs bg-secondary text-secondary-foreground flex items-center gap-1">
              <Gift className="w-3 h-3" />
              2 mois offerts
            </Badge>
          )}
        </div>

        {/* Single Plan Card */}
        <div className="relative bg-card p-6 rounded-2xl border-2 border-primary shadow-xl ring-2 ring-primary/20">
          {/* Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-lg">
              <Sparkles className="w-4 h-4" />
              Offre Unique
            </span>
          </div>

          {/* Plan name */}
          <div className="text-center mt-4 mb-4">
            <h3 className="text-xl font-bold text-foreground mb-1">{PLAN.name}</h3>
            <p className="text-muted-foreground text-sm">{PLAN.description}</p>
          </div>

          {/* Price */}
          <div className="text-center mb-4">
            {isYearly ? (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-foreground">390€</span>
                  <span className="text-muted-foreground">/an</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Soit 32,50€/mois au lieu de 39€
                </p>
                {/* Gift highlight */}
                <div className="mt-3 inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full">
                  <Gift className="w-5 h-5" />
                  <span className="font-bold">2 mois offerts !</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Paiement unique de 390€ • Accès immédiat 12 mois
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-foreground">39€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Facturé mensuellement • Sans engagement
                </p>
              </>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-2 mb-4">
            {PLAN.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-secondary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            disabled={isProcessing}
            onClick={() => handleSelectPlan(PLAN.id)}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Commencer maintenant"
            )}
          </Button>

          {/* Trust */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            Annuler à tout moment • Paiement sécurisé
          </p>
        </div>

        {/* TrustAvis */}
        <div className="mt-6">
          <TrustAvisCarousel />
        </div>
      </main>
      
      {/* Sticky TrustAvis Rating - Bottom Right */}
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
