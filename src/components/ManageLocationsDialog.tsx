import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Check, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

type StoredLocation = {
  id: string;
  name: string;
  google_place_id: string | null;
  is_active: boolean | null;
  address: string | null;
};
type DiscoveredLocation = {
  name: string;
  google_place_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
}

/** The two jobs are distinct:
 * 1) Select which saved Google locations are MANAGED (checks + plan quota).
 * 2) Switch between those managed locations on Dashboard/Reviews.
 * Google API is only needed to discover additional, previously unknown locations.
 */
export function ManageLocationsDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const en = i18n.language?.toLowerCase().startsWith("en");
  const t = (fr: string, english: string) => en ? english : fr;
  const [locations, setLocations] = useState<StoredLocation[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [limit, setLimit] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { syncBusinesses, isSyncing } = useSyncGoogleBusinesses();
  const [discovered, setDiscovered] = useState<DiscoveredLocation[]>([]);
  const [remoteOpen, setRemoteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError("");
    const [biz, access] = await Promise.all([
      supabase.from("businesses")
        .select("id,name,google_place_id,is_active,address")
        .eq("user_id", user.id)
        .not("google_place_id", "is", null)
        .order("name", { ascending: true }),
      (supabase as any).rpc("get_my_google_connection_status"),
    ]);
    if (biz.error) {
      setLoadError(biz.error.message);
    } else {
      setLocations((biz.data || []) as StoredLocation[]);
      setSelection((biz.data || []).filter(b => b.is_active).map(b => b.id));
    }
    if (access.error || !access.data?.success) {
      setLoadError(prev => prev || access.error?.message || t("Impossible de lire le forfait.", "Could not read plan."));
    } else {
      setLimit(Math.max(1, access.data.max_businesses || 1));
    }
    setLoading(false);
  }, [user?.id, i18n.language]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  const toggle = (id: string) => {
    const exists = selection.includes(id);
    if (exists) {
      setSelection(current => current.filter(x => x !== id));
    } else if (selection.length >= limit) {
      toast({ title: t("Limite du forfait atteinte", "Plan limit reached"),
        description: t(`Ce forfait permet ${limit} établissement(s) actif(s). Décochez-en un avant d'en choisir un autre.`,
          `Your plan allows ${limit} active location(s). Uncheck one before selecting another.`),
        variant: "destructive" });
    } else {
      setSelection(current => [...current, id]);
    }
  };

  const save = async () => {
    if (!selection.length || selection.length > limit) return;
    setSaving(true);
    const { data, error } = await (supabase as any).rpc("set_my_managed_google_locations", {
      selected_ids: selection,
    });
    if (error || !data?.success) {
      toast({ title: t("Impossible d'enregistrer", "Cannot save locations"),
        description: error?.message || data?.error || t("Réessayez.", "Please retry."), variant: "destructive" });
    } else {
      toast({ title: t("Établissements gérés mis à jour", "Managed locations updated"),
        description: t(`${selection.length} fiche(s) active(s) pour Avis, SEO et GEO.`,
          `${selection.length} active location(s) for Reviews, SEO and GEO.`) });
      onOpenChange(false);
      await onSuccess();
    }
    setSaving(false);
  };

  const discover = async () => {
    const result = await syncBusinesses(true);
    if (!result.success || !result.google_businesses?.length) {
      toast({ title: t("Impossible de récupérer toutes les fiches Google", "Google location discovery failed"),
        description: result.message || t("Les fiches déjà enregistrées restent sélectionnables ci-dessus. Vérifiez l'autorisation Google dans Paramètres pour en découvrir d'autres.",
          "Saved locations remain selectable here. Check Google permissions in Settings to discover more."),
        variant: "destructive" });
      return;
    }
    setDiscovered(result.google_businesses);
    setLimit(Math.max(1, result.max_businesses || limit));
    onOpenChange(false);
    setRemoteOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-24px)] sm:max-w-lg max-h-[88dvh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {t("Choisir les établissements gérés", "Choose managed locations")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {t("Cochez les fiches dont vous voulez gérer les avis, le SEO et le GEO. Les autres restent enregistrées et ne sont pas supprimées.",
                "Check the locations to manage for reviews, SEO and GEO. Others remain saved; none are deleted.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-xs sm:text-sm">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" />
              {t("Places disponibles", "Plan capacity")}
            </span>
            <span className="font-bold tabular-nums">{selection.length} / {limit}</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-1">
            {loading ? <div className="py-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : null}
            {loadError && <p role="alert" className="rounded-lg border border-amber-500/30 p-3 text-xs text-amber-700 break-words">{loadError}</p>}
            {!loading && !locations.length && <p className="py-5 text-center text-xs text-muted-foreground">
              {t("Aucun établissement encore enregistré. Cliquez sur « Rechercher sur Google ».", "No stored locations. Discover your Google locations below.")}
            </p>}
            {!loading && locations.map(loc => {
              const checked = selection.includes(loc.id);
              const disabled = !checked && selection.length >= limit;
              return <label key={loc.id}
                className={`flex gap-3 items-center rounded-xl border p-3 sm:p-3.5 transition-colors cursor-pointer ${checked ? "border-primary bg-primary/5" : "border-border"} ${disabled ? "opacity-65" : ""}`}>
                <Checkbox checked={checked} onCheckedChange={() => toggle(loc.id)}
                  aria-label={t("Activer", "Activate") + " " + loc.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{loc.name}</p>
                    {checked && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  {loc.address && <p className="text-[11px] text-muted-foreground truncate">{loc.address}</p>}
                </div>
              </label>;
            })}
          </div>
          <div className="border-t pt-3 space-y-2">
            <Button type="button" variant="outline" className="w-full h-10 gap-2"
              disabled={loading || saving || isSyncing} onClick={() => void discover()}>
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {t("Rechercher d'autres fiches sur Google", "Discover more Google locations")}
            </Button>
            <DialogFooter className="flex flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none"
                onClick={() => onOpenChange(false)}>{t("Annuler", "Cancel")}</Button>
              <Button type="button" className="flex-1 sm:flex-none" disabled={loading || saving || !!loadError || selection.length === 0 || selection.length > limit}
                onClick={() => void save()}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {t("Enregistrer", "Save")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <SelectBusinessesDialog open={remoteOpen} onOpenChange={setRemoteOpen}
        businesses={discovered} maxBusinesses={limit}
        userId={user?.id || ""}
        initialSelectedGooglePlaceIds={locations.filter(b => b.is_active).map(b => b.google_place_id).filter((id): id is string => !!id)}
        onSuccess={() => { setRemoteOpen(false); void onSuccess(); }} />
    </>
  );
}
