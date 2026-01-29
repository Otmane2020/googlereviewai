import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Star, Zap, Building2, LogOut, Check, ShieldCheck, Users, Clock } from "lucide-react";
import { TrustAvisCarousel } from "@/components/TrustAvisBadge";
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
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
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
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
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
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
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
            // Always show monthly price, but yearly is divided by 12
            const displayPrice = isYearly ? (plan.priceYearly / 12) : plan.priceMonthly;
            
            return (
              <div
                key={plan.id}
                className="relative rounded-xl border-2 border-border bg-card hover:border-primary/50 p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${plan.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
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
                      {displayPrice.toFixed(2)}€
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      /mois{isYearly && " (facturé annuellement)"}
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

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Annulation 1 clic</span>
          </div>
        </div>

        {/* TrustAvis */}
        <div className="mt-6">
          <TrustAvisCarousel />
        </div>

        {/* Ils nous font confiance */}
        <div className="mt-8">
          <p className="text-center text-xs text-muted-foreground mb-4">
            <Users className="inline h-3.5 w-3.5 mr-1" />
            +500 entreprises nous font confiance
          </p>
          
          {/* Scrolling logos */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll-logos gap-12 py-4">
              {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} className="flex gap-12 shrink-0 items-center">
                  {[
                    { name: "McDonald's", domain: "mcdonalds.fr" },
                    { name: "Carrefour", domain: "carrefour.fr" },
                    { name: "Decathlon", domain: "decathlon.fr" },
                    { name: "Sephora", domain: "sephora.fr" },
                    { name: "Fnac", domain: "fnac.com" },
                    { name: "Leroy Merlin", domain: "leroymerlin.fr" },
                    { name: "Boulanger", domain: "boulanger.com" },
                    { name: "Darty", domain: "darty.com" },
                  ].map((brand) => (
                    <div
                      key={`${setIndex}-${brand.name}`}
                      className="flex items-center gap-2 shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
                    >
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
                        alt={brand.name}
                        className="w-6 h-6 object-contain"
                        loading="lazy"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{brand.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-6 pb-4">
          🔒 Données protégées • 💳 Stripe sécurisé • ✅ Satisfait ou remboursé
        </p>
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
