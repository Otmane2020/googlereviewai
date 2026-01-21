import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Globe, Loader2, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleBusiness {
  name: string;
  google_place_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
}

interface SelectBusinessesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businesses: GoogleBusiness[];
  maxBusinesses: number;
  userId: string;
  onSuccess: () => void;
}

export const SelectBusinessesDialog = ({
  open,
  onOpenChange,
  businesses,
  maxBusinesses,
  userId,
  onSuccess,
}: SelectBusinessesDialogProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggleBusiness = (googlePlaceId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(googlePlaceId)) {
      newSelected.delete(googlePlaceId);
    } else {
      if (newSelected.size >= maxBusinesses) {
        toast({
          title: "Limite atteinte",
          description: `Votre plan permet ${maxBusinesses} établissement${maxBusinesses > 1 ? "s" : ""} maximum.`,
          variant: "destructive",
        });
        return;
      }
      newSelected.add(googlePlaceId);
    }
    setSelected(newSelected);
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un établissement.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const selectedBusinesses = businesses.filter((b) =>
        selected.has(b.google_place_id)
      );

      const { error } = await supabase.functions.invoke("save-selected-businesses", {
        body: {
          businesses: selectedBusinesses,
        },
      });

      if (error) throw error;

      toast({
        title: "Établissements synchronisés",
        description: `${selected.size} établissement${selected.size > 1 ? "s" : ""} ajouté${selected.size > 1 ? "s" : ""}.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving businesses:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les établissements.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Sélectionnez vos établissements
          </DialogTitle>
          <DialogDescription>
            Votre plan permet{" "}
            <span className="font-semibold text-foreground">
              {maxBusinesses} établissement{maxBusinesses > 1 ? "s" : ""}
            </span>
            . Choisissez {maxBusinesses > 1 ? "lesquels" : "lequel"} synchroniser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-4">
          {businesses.map((business) => {
            const isSelected = selected.has(business.google_place_id);
            const isDisabled = !isSelected && selected.size >= maxBusinesses;

            return (
              <div
                key={business.google_place_id}
                onClick={() => !isDisabled && toggleBusiness(business.google_place_id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isDisabled
                    ? "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{business.name}</div>
                    {business.address && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{business.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      {business.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">
                            {business.website.replace(/^https?:\/\//, "")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Badge variant="secondary" className="gap-1">
              <Crown className="w-3 h-3" />
              {selected.size}/{maxBusinesses} sélectionné{selected.size > 1 ? "s" : ""}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving || selected.size === 0}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Confirmer"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
