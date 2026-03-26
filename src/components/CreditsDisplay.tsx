import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";

interface CreditsDisplayProps {
  credits: number;
  planName?: string;
  compact?: boolean;
}

export const CreditsDisplay = ({ credits, planName, compact = false }: CreditsDisplayProps) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 h-9">
            <Coins className="w-4 h-4 text-accent" />
            <span className="font-semibold">{credits}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Solde de crédits</p>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="w-5 h-5 text-accent" />
                <span className="text-2xl font-bold text-foreground">{credits}</span>
                <span className="text-muted-foreground text-sm">crédits</span>
              </div>
              {planName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Plan {planName.charAt(0).toUpperCase() + planName.slice(1)}
                </p>
              )}
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                1 crédit = 1 réponse IA · 25 gratuits/mois
              </p>
              <Button size="sm" className="w-full gap-2" onClick={() => navigate("/settings?tab=credits")}>
                <Plus className="w-4 h-4" />
                Recharger
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Solde de crédits</p>
          <div className="flex items-center gap-2 mt-1">
            <Coins className="w-6 h-6 text-accent" />
            <span className="text-3xl font-bold text-foreground">{credits}</span>
          </div>
          {planName && (
            <p className="text-xs text-muted-foreground mt-1">
              Plan {planName.charAt(0).toUpperCase() + planName.slice(1)}
            </p>
          )}
        </div>
        <Button size="sm" className="gap-2" onClick={() => navigate("/settings?tab=credits")}>
          <Plus className="w-4 h-4" />
          Recharger
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-3 border-t border-border/50 pt-3">
        1 crédit = 1 réponse IA · 25 crédits gratuits/mois
      </p>
    </div>
  );
};
