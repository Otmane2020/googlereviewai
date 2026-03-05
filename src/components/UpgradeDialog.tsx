import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Sparkles, Coins, ChevronDown, Loader2, Check, ArrowRight, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreditPack {
  price: number;
  credits: number;
  priceKey: string;
}

const creditPacks: CreditPack[] = [
  { price: 2.99, credits: 10, priceKey: "credits_10" },
  { price: 29, credits: 100, priceKey: "credits_100" },
  { price: 99, credits: 330, priceKey: "credits_330" },
  { price: 199, credits: 660, priceKey: "credits_660" },
  { price: 299, credits: 1000, priceKey: "credits_1000" },
  { price: 499, credits: 1660, priceKey: "credits_1660" },
  { price: 999, credits: 3330, priceKey: "credits_3330" },
  { price: 1999, credits: 6660, priceKey: "credits_6660" },
  { price: 2999, credits: 10000, priceKey: "credits_10000" },
];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
}

export const UpgradeDialog = ({ open, onOpenChange, currentPlan }: UpgradeDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const isAlreadyUpgraded = currentPlan?.toLowerCase() === "daily" || currentPlan?.toLowerCase() === "pro" || currentPlan?.toLowerCase() === "business";

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey: "daily_monthly",
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyCredits = async (pack: CreditPack) => {
    setLoadingCredits(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceKey: pack.priceKey,
          mode: "payment",
          successUrl: `${window.location.origin}/dashboard?credits_success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Credits checkout error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    } finally {
      setLoadingCredits(false);
    }
  };

  const upgradeFeatures = [
    "Posts SEO quotidiens",
    "Q&A AEO quotidiens (ChatGPT)",
    "100 crédits/mois",
    "2 établissements",
    "Support prioritaire",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-gradient-to-b from-background to-muted/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-primary/30">
              <Crown className="w-7 h-7 text-primary-foreground" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Passez au <span className="text-primary">Quotidien</span>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              Publiez tous les jours sur Google pour maximiser votre visibilité
            </p>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="px-4 pb-4 pt-2">
          <div className="relative rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-destructive text-white shadow-lg px-3 py-1 text-xs font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                PUBLICATION QUOTIDIENNE
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                <Star className="w-7 h-7 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">Quotidien</h3>
                <p className="text-sm text-muted-foreground">SEO + AEO tous les jours</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">9,99€</div>
                <div className="text-xs text-muted-foreground">/mois</div>
              </div>
            </div>

            <ul className="space-y-2 mb-4">
              {upgradeFeatures.map((feature) => (
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
              disabled={isLoading || isAlreadyUpgraded}
              className="w-full rounded-xl h-12 font-semibold bg-destructive hover:bg-destructive/90 text-white shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAlreadyUpgraded ? (
                "✓ Déjà activé"
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Passer au Quotidien
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Credit Packs Section */}
        <div className="px-4 pb-6 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Recharger des crédits</span>
            <Badge variant="outline" className="text-[10px] ml-auto">~0.30€/crédit</Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between rounded-xl h-12"
                disabled={loadingCredits}
              >
                {loadingCredits ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-primary" />
                      Choisir un pack de crédits
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[400px]" align="center">
              {creditPacks.map((pack) => (
                <DropdownMenuItem 
                  key={pack.priceKey}
                  onClick={() => handleBuyCredits(pack)}
                  className="flex items-center justify-between py-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{pack.credits.toLocaleString()} crédits</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(pack.price / pack.credits * 100).toFixed(1)}¢/crédit)
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">{pack.price}€</Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 pb-4 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-foreground" />
          <span>Paiement 100% sécurisé</span>
          <Shield className="w-3 h-3 text-foreground" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
