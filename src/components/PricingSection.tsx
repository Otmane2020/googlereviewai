import { useState } from "react";
import { Button } from "./ui/button";
import { Check, Star, Sparkles, Loader2, Gift, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";

export const PricingSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey: "daily_monthly",
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/#pricing`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur de paiement";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const freePlanFeatures = [
    "Gestion des avis Google avec IA",
    "1 post SEO par semaine",
    "10 crédits offerts",
    "1 établissement",
    "Synchronisation automatique",
  ];

  const upgradePlanFeatures = [
    "Tout le plan Gratuit +",
    "Posts SEO quotidiens",
    "Q&A AEO quotidiens (ChatGPT)",
    "100 crédits/mois",
    "2 établissements",
    "Support prioritaire",
  ];

  return (
    <section id="pricing" className="py-14 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-5">
            <Star className="w-4 h-4 text-accent" />
            <span className="text-accent-foreground text-xs sm:text-sm font-semibold">Gratuit pour toujours</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Gratuit. Sans surprise.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gérez vos avis Google gratuitement. Passez au quotidien quand vous êtes prêt.
          </p>
        </div>

        {/* 2 Plan Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="relative rounded-2xl border-2 border-primary bg-primary/5 p-6 transition-all hover:shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground shadow-lg px-3 py-1 text-xs font-semibold">
                <Gift className="w-3 h-3 mr-1" />
                100% GRATUIT
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Gratuit</h3>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">0€</span>
                <span className="text-muted-foreground text-sm">/mois</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pour toujours, sans carte bancaire
              </p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {freePlanFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-secondary" />
                  </div>
                  <span className="text-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate("/auth")}
              className="w-full rounded-xl h-12 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Commencer gratuitement
            </Button>
          </div>

          {/* Upgrade Plan */}
          <div className="relative rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-6 transition-all hover:shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-destructive text-white shadow-lg px-3 py-1 text-xs font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                PUBLICATION QUOTIDIENNE
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Quotidien</h3>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">9,99€</span>
                <span className="text-muted-foreground text-sm">/mois</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Publiez tous les jours sur Google
              </p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {upgradePlanFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-secondary" />
                  </div>
                  <span className="text-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full rounded-xl h-12 font-semibold bg-destructive hover:bg-destructive/90 text-white shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Passer au Quotidien
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Trust */}
        <div className="flex items-center justify-center gap-4 mt-8 text-xs text-muted-foreground">
          <span>{t("pricing.cancelAnytime")}</span>
          <span>•</span>
          <span>Sans carte bancaire pour le plan gratuit</span>
        </div>
      </div>
    </section>
  );
};
