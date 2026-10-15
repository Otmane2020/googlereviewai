import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Globe, Loader2, Check, Square, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleBusiness {
  name: string;
  google_place_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  profile_image_url?: string | null;
}

interface SelectBusinessesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businesses: GoogleBusiness[];
  maxBusinesses: number;
  userId: string;
  initialSelectedGooglePlaceIds?: string[];
  onSuccess: () => void | Promise<void>;
}

// IMPORTANT: Never use [] as a default value in the component's parameter list:
// a new array on each render retriggers the selection initialization effect,
// clearing checked locations every time a user clicks one.
const EMPTY_INITIAL_SELECTION: string[] = [];

export const SelectBusinessesDialog = ({
  open,
  onOpenChange,
  businesses,
  maxBusinesses,
  userId,
  initialSelectedGooglePlaceIds = EMPTY_INITIAL_SELECTION,
  onSuccess,
}: SelectBusinessesDialogProps) => {
  const { i18n } = useTranslation();
  const isFrench = !(i18n.resolvedLanguage || i18n.language || "fr").toLowerCase().startsWith("en");
  const tr = (fr: string, en: string) => isFrench ? fr : en;
  const limit = Math.max(1, maxBusinesses);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Depend on the stable IDs, not on an array object created by a parent
  // render. A re-render while the dialog is open must not clear user's ticks.
  const availableLocationKeys = businesses.map(b => b.google_place_id).join("|");
  const initiallySelectedKeys = initialSelectedGooglePlaceIds.join("|");

  useEffect(() => {
    if (!open) return;
    const availableIds = new Set(availableLocationKeys.split("|").filter(Boolean));
    const validInitial = initiallySelectedKeys.split("|").filter(id => availableIds.has(id)).slice(0, limit);
    // Starter is a single choice. Preselect the first available location
    // for an immediately usable dialog; tapping another replaces the choice.
    if (validInitial.length === 0 && limit === 1 && availableLocationKeys) {
      validInitial.push(availableLocationKeys.split("|")[0]);
    }
    setSelected(new Set(validInitial));
    setSaveError(null);
  }, [open, availableLocationKeys, initiallySelectedKeys, limit]);

  const toggleBusiness = (googlePlaceId: string) => {
    if (saving || !googlePlaceId) return;
    setSaveError(null);
    if (!selected.has(googlePlaceId) && selected.size >= limit && limit !== 1) {
      toast({
        title: tr("Limite du forfait atteinte", "Plan limit reached"),
        description: tr(
          `Votre forfait permet ${limit} établissements. Désélectionnez d'abord une fiche pour la remplacer.`,
          `Your plan allows ${limit} locations. Deselect one before choosing another.`,
        ),
        variant: "destructive",
      });
      return;
    }
    setSelected(previous => {
      const next = new Set(previous);
      if (next.has(googlePlaceId)) {
        next.delete(googlePlaceId);
      } else if (limit === 1) {
        // Radio-like behavior on a one-location plan: switching is one tap.
        return new Set([googlePlaceId]);
      } else {
        next.add(googlePlaceId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      setSaveError(tr("Sélectionnez au moins un établissement.", "Select at least one location."));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const selectedBusinesses = businesses.filter(b => selected.has(b.google_place_id));
      const { data, error } = await supabase.functions.invoke("save-selected-businesses", {
        body: { businesses: selectedBusinesses },
      });
      if (error || !data?.success) {
        let message = data?.error || error?.message || tr("Enregistrement impossible.", "Unable to save.");
        if (error && "context" in error) {
          try {
            const details = await (error as { context?: Response }).context?.clone?.().json?.();
            message = details?.error || details?.message || message;
          } catch {
            // Keep the safe error message if the server response is not JSON.
          }
        }
        throw new Error(message);
      }
      await onSuccess();
      toast({
        title: tr("Établissement sélectionné", "Location selected"),
        description: tr(
          `${selected.size} établissement${selected.size > 1 ? "s" : ""} activé${selected.size > 1 ? "s" : ""}.`,
          `${selected.size} location${selected.size > 1 ? "s" : ""} activated.`,
        ),
      });
      onOpenChange(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : tr(
        "Impossible d’enregistrer les établissements. Réessayez.",
        "Unable to save your locations. Please retry.",
      ));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100vw-24px)] max-w-xl flex-col gap-0 overflow-hidden rounded-[22px] border-border/70 bg-background p-0 shadow-2xl max-h-[min(88dvh,760px)] sm:rounded-[24px]">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/70 bg-card px-4 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold leading-tight text-foreground">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </span>
            {tr("Sélectionnez vos établissements", "Select your locations")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {tr("Votre forfait autorise", "Your plan includes")}{" "}
            <strong className="text-foreground">
              {limit} {tr(limit > 1 ? "établissements" : "établissement", limit > 1 ? "locations" : "location")}
            </strong>
            .{" "}{tr(
              limit === 1 ? "Choisissez la fiche Google à gérer." : "Choisissez les fiches Google à gérer.",
              limit === 1 ? "Choose the Google listing to manage." : "Choose the Google listings to manage.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4">
          {businesses.length === 0 && (
            <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              {tr("Aucun établissement Google trouvé.", "No Google locations found.")}
            </p>
          )}
          {businesses.map(business => {
            const isSelected = selected.has(business.google_place_id);
            return (
              <button
                type="button"
                key={business.google_place_id}
                aria-pressed={isSelected}
                aria-label={tr("Sélectionner", "Select") + " " + business.name}
                disabled={saving}
                onClick={() => toggleBusiness(business.google_place_id)}
                className={`flex w-full min-w-0 items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-4 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/80 bg-card hover:border-primary/40 hover:bg-primary/[0.025]"
                } disabled:opacity-60`}
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/35 bg-background"
                }`} aria-hidden="true">
                  {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3px]" /> : <Square className="h-3.5 w-3.5 opacity-0" />}
                </span>
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-primary/5 sm:h-16 sm:w-16" aria-hidden="true">
                  <Building2 className="h-7 w-7 text-primary/45" />
                  {business.profile_image_url && (
                    <img
                      src={business.profile_image_url}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={event => { event.currentTarget.style.display = "none"; }}
                    />
                  )}
                </span>
                <span className="block min-w-0 flex-1 space-y-1.5">
                  <span className="block break-words text-sm font-semibold leading-snug text-foreground">{business.name}</span>
                  {business.address && (
                    <span className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 break-words">{business.address}</span>
                    </span>
                  )}
                  {business.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{business.phone}</span>
                    </span>
                  )}
                  {business.website && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 break-all">{business.website.replace(/^https?:\/\//, "")}</span>
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span className="hidden shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary sm:inline">
                    {tr("Choisi", "Selected")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 bg-card px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary" className="gap-1.5 rounded-lg px-2.5 py-1.5 text-xs">
              {selected.size}/{limit} {tr(selected.size > 1 ? "sélectionnés" : "sélectionné", "selected")}
            </Badge>
            <div className="flex flex-1 items-center justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={saving}>
                {tr("Annuler", "Cancel")}
              </Button>
              <Button type="button" className="rounded-xl px-5" onClick={() => void handleSave()} disabled={saving || selected.size === 0}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? tr("Enregistrement…", "Saving…") : tr("Confirmer", "Confirm")}
              </Button>
            </div>
          </div>
          {saveError && (
            <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-words">{saveError}</span>
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
