import { AlertTriangle, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { UpgradeDialog } from "@/components/UpgradeDialog";

interface LowCreditsBannerProps {
  credits: number;
  pendingReviews?: number;
  currentPlan?: string;
}

export const LowCreditsBanner = ({ credits, pendingReviews = 0, currentPlan }: LowCreditsBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Reset dismissed state when credits change to 0
  useEffect(() => {
    if (credits === 0) {
      setDismissed(false);
    }
  }, [credits]);

  // Don't show if credits > 0 or dismissed
  if (credits > 0 || dismissed) return null;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-gradient-to-r from-destructive/10 via-destructive/5 to-orange-500/10 p-4">
        {/* Background decoration */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-destructive/10 rounded-full blur-2xl" />
        
        <div className="relative flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground text-sm">
                Crédits épuisés !
              </h4>
              <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-xs font-medium rounded-full">
                0 crédit
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {pendingReviews > 0 
                ? `${pendingReviews} avis ne peuvent pas recevoir de réponse IA automatique.`
                : "Les réponses IA automatiques sont en pause."
              }
              {" "}Rechargez pour continuer.
            </p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <Button 
                size="sm" 
                className="h-8 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white"
                onClick={() => setUpgradeDialogOpen(true)}
              >
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Recharger
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-3 text-xs text-muted-foreground"
                onClick={() => setDismissed(true)}
              >
                Plus tard
              </Button>
            </div>
          </div>
          
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <UpgradeDialog 
        open={upgradeDialogOpen} 
        onOpenChange={setUpgradeDialogOpen} 
        currentPlan={currentPlan}
      />
    </>
  );
};
