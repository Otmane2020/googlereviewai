import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Plus, Lock } from "lucide-react";

interface Business {
  id: string;
  name: string;
  address: string | null;
}

interface BusinessSubscriptionSelectorProps {
  businesses: Business[];
  moduleType: "aeo" | "seo";
  onSubscribe: (selectedBusinessIds: string[], annual: boolean) => void;
  isLoading?: boolean;
}

export const BusinessSubscriptionSelector = ({
  businesses,
  moduleType,
  onSubscribe,
  isLoading = false,
}: BusinessSubscriptionSelectorProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    businesses.map(b => b.id) // Default: all selected
  );
  const [isAnnual, setIsAnnual] = useState(false);

  const pricePerBusiness = 49;
  const annualDiscountRate = 0.8; // 20% discount
  const selectedCount = selectedIds.length;
  const monthlyTotal = pricePerBusiness * Math.max(1, selectedCount);
  const annualMonthlyTotal = Math.round(pricePerBusiness * annualDiscountRate * Math.max(1, selectedCount));

  const toggleBusiness = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleSubscribe = () => {
    if (selectedIds.length === 0) return;
    onSubscribe(selectedIds, isAnnual);
  };

  const moduleName = moduleType === "aeo" ? "ChatGPT Rank (AEO)" : "SEO AutoPost";

  return (
    <>
      {/* Compact Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground">Module Premium {moduleType.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                49€/mois <span className="text-primary font-medium">(par établissement)</span>
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setDialogOpen(true)} 
            size="sm" 
            className="w-full"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Choisir mes établissements
          </Button>
        </CardContent>
      </Card>

      {/* Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>S'abonner à {moduleName}</DialogTitle>
            <DialogDescription>
              Sélectionnez les établissements à inclure dans votre abonnement. 
              <span className="font-medium text-foreground"> 49€/mois par établissement.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4 max-h-[300px] overflow-y-auto">
            {businesses.map((business) => {
              const isSelected = selectedIds.includes(business.id);
              return (
                <div
                  key={business.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleBusiness(business.id)}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => toggleBusiness(business.id)}
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{business.name}</p>
                    {business.address && (
                      <p className="text-xs text-muted-foreground truncate">{business.address}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    +49€
                  </Badge>
                </div>
              );
            })}

            {businesses.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun établissement</p>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Établissements sélectionnés</span>
              <span className="font-medium">{selectedCount} / {businesses.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total mensuel</span>
              <span className="text-lg font-bold text-primary">{monthlyTotal}€/mois</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Annuel (-20%)</span>
              <span className="text-secondary font-medium">{annualMonthlyTotal}€/mois</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAnnual(true);
                handleSubscribe();
              }}
              disabled={selectedCount === 0 || isLoading}
              className="flex-1"
            >
              Annuel - {annualMonthlyTotal}€/mois
            </Button>
            <Button
              onClick={() => {
                setIsAnnual(false);
                handleSubscribe();
              }}
              disabled={selectedCount === 0 || isLoading}
              className="flex-1"
            >
              Mensuel - {monthlyTotal}€/mois
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
