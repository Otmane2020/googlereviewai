import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Plus, Lock, Minus } from "lucide-react";

interface Business {
  id: string;
  name: string;
  address: string | null;
}

interface BusinessSubscriptionSelectorProps {
  businesses: Business[];
  moduleType: "aeo" | "seo";
  onSubscribe: (selectedBusinessIds: string[], annual: boolean, quantity: number) => void;
  isLoading?: boolean;
}

export const BusinessSubscriptionSelector = ({
  businesses,
  moduleType,
  onSubscribe,
  isLoading = false,
}: BusinessSubscriptionSelectorProps) => {
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const t = (fr: string, en: string) => (isEN ? en : fr);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    businesses.map(b => b.id) // Default: all selected
  );
  const [isAnnual, setIsAnnual] = useState(false);
  // Allow user to select more stores than they have
  const [quantity, setQuantity] = useState(Math.max(1, businesses.length));

  const pricePerBusiness = 29;
  const annualDiscountRate = 0.8; // 20% discount
  const monthlyTotal = pricePerBusiness * quantity;
  const annualMonthlyTotal = Math.round(pricePerBusiness * annualDiscountRate * quantity);

  const toggleBusiness = (id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id];
      // Update quantity to match selection if they select more businesses
      if (newSelection.length > quantity) {
        setQuantity(newSelection.length);
      }
      return newSelection;
    });
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, Math.max(selectedIds.length, prev - 1)));
  };

  const handleSubscribe = () => {
    if (quantity === 0) return;
    onSubscribe(selectedIds, isAnnual, quantity);
  };

  const moduleLabel = moduleType === "aeo" ? "AEO" : "SEO";

  return (
    <>
      {/* Compact Banner — redirige vers la page Tarifs (Quotidien 9,99€ / Agence 49€) */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground">{t(`Module ${moduleLabel} Premium`, `Premium ${moduleLabel} Module`)}</p>
              <p className="text-xs text-muted-foreground">
                {isEN ? <>Included in <span className="text-primary font-medium">Daily ($9.99/month)</span> or Agency</> : <>Inclus dans <span className="text-primary font-medium">Quotidien (9,99€/mois)</span> ou Agence</>}
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              const ids = businesses.map(b => b.id);
              onSubscribe(ids, false, Math.max(1, ids.length));
            }}
            size="sm"
            className="w-full"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("Voir les abonnements", "View subscriptions")}
          </Button>
        </CardContent>
      </Card>

      {/* Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEN ? `Subscribe to ${moduleLabel}` : `S'abonner à ${moduleLabel}`}</DialogTitle>
            <DialogDescription>
              {t("Choisissez le nombre d'établissements à inclure.", "Choose the number of businesses to include.")}
              <span className="font-medium text-foreground"> {t("29 €/mois par établissement.", "€29/month per business.")}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Quantity Selector */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <Label className="text-sm font-medium mb-3 block">{t("Nombre d'établissements", "Number of businesses")}</Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={quantity <= 1 || quantity <= selectedIds.length}
                className="h-10 w-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[80px]">
                <span className="text-3xl font-bold text-primary">{quantity}</span>
                <p className="text-xs text-muted-foreground">
                  {isEN ? (quantity === 1 ? "business" : "businesses") : (quantity === 1 ? "établissement" : "établissements")}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                className="h-10 w-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Business List (optional selection) */}
          {businesses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vos établissements actuels</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
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
                    </div>
                  );
                })}
              </div>
              {quantity > businesses.length && (
                <p className="text-xs text-muted-foreground italic">
                  + {quantity - businesses.length} établissement{quantity - businesses.length > 1 ? "s" : ""} supplémentaire{quantity - businesses.length > 1 ? "s" : ""} à ajouter plus tard
                </p>
              )}
            </div>
          )}

          {businesses.length === 0 && (
            <div className="text-center py-4">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                Vous pourrez ajouter des établissements après l'abonnement
              </p>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Établissements</span>
              <span className="font-medium">{quantity} × 29 €</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total mensuel</span>
              <span className="text-lg font-bold text-primary">{monthlyTotal} €/mois</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Annuel (-20%)</span>
              <span className="text-secondary font-medium">{annualMonthlyTotal} €/mois</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAnnual(true);
                handleSubscribe();
              }}
              disabled={quantity === 0 || isLoading}
              className="flex-1"
            >
              Annuel - {annualMonthlyTotal} €/mois
            </Button>
            <Button
              onClick={() => {
                setIsAnnual(false);
                handleSubscribe();
              }}
              disabled={quantity === 0 || isLoading}
              className="flex-1"
            >
              Mensuel - {monthlyTotal} €/mois
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
