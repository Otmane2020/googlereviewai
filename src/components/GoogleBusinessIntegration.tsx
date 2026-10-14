import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useSyncGoogleBusinesses } from "@/hooks/useSyncGoogleBusinesses";
import { SelectBusinessesDialog } from "@/components/SelectBusinessesDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Check, Link2Off, Loader2, RefreshCw, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GoogleBusiness {
  name: string;
  google_place_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
}

interface ConnectionStatus {
  connected: boolean;
  active_count: number;
  active_google_place_ids: string[];
  max_businesses: number;
}

interface GoogleBusinessIntegrationProps {
  onBusinessesChanged?: () => void;
}

export function GoogleBusinessIntegration({ onBusinessesChanged }: GoogleBusinessIntegrationProps) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const tr = (fr: string, en: string) => isEN ? en : fr;
  const { initiateOAuth, isConnecting } = useGoogleOAuth();
  const { syncBusinesses, isSyncing } = useSyncGoogleBusinesses();

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [requiresReconnect, setRequiresReconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [availableBusinesses, setAvailableBusinesses] = useState<GoogleBusiness[]>([]);
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[]>([]);
  const [selectionLimit, setSelectionLimit] = useState(1);

  const loadStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    const { data, error: requestError } = await supabase.functions.invoke("manage-google-connection", {
      body: { action: "status" },
    });
    if (requestError || !data?.success) {
      setError(tr("Impossible de vérifier la connexion Google.", "Unable to check Google connection."));
    } else {
      setError(null);
      setStatus({
        connected: !!data.connected,
        active_count: data.active_count || 0,
        active_google_place_ids: data.active_google_place_ids || [],
        max_businesses: data.max_businesses || 1,
      });
      if (!data.connected) setRequiresReconnect(false);
    }
    setChecking(false);
  }, [user, i18n.language]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const connectGoogle = async () => {
    setError(null);
    sessionStorage.setItem("google_oauth_return_to", "/settings");
    await initiateOAuth();
  };

  const refreshReviews = async () => {
    const { data, error: requestError } = await supabase.functions.invoke("sync-google-reviews", { body: {} });
    if (requestError || data?.success === false) {
      toast({
        title: tr("Établissements synchronisés, avis non actualisés", "Locations synced, reviews not refreshed"),
        description: data?.message || data?.error || requestError?.message || tr("Réessayez depuis la page Avis.", "Retry from Reviews."),
        variant: "destructive",
      });
    }
  };

  const syncGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await syncBusinesses();
      if (!result.success) {
        setRequiresReconnect(!!result.requires_reconnect);
        setError(result.message || tr("La synchronisation Google a échoué.", "Google sync failed."));
        return;
      }
      if (result.requires_selection && result.google_businesses?.length) {
        setAvailableBusinesses(result.google_businesses);
        setSelectionLimit(result.max_businesses || status?.max_businesses || 1);
        setInitialSelectedIds(status?.active_google_place_ids || []);
        setSelectionOpen(true);
        return;
      }
      setRequiresReconnect(false);
      await loadStatus();
      onBusinessesChanged?.();
      toast({
        title: tr("Synchronisation terminée", "Sync completed"),
        description: tr(`${result.businesses?.length || 0} établissement(s) mis à jour.`, `${result.businesses?.length || 0} location(s) updated.`),
      });
      // Reviews are handled by a separate endpoint after locations are discovered.
      await refreshReviews();
    } finally {
      setBusy(false);
    }
  };

  const selectionSaved = () => {
    void (async () => {
      await loadStatus();
      onBusinessesChanged?.();
      await refreshReviews();
    })();
  };

  const disconnect = async () => {
    if (!window.confirm(tr(
      "Déconnecter Google Business ? La synchronisation automatique sera arrêtée. Vos établissements et avis déjà enregistrés seront conservés.",
      "Disconnect Google Business? Automatic synchronization will stop. Existing locations and reviews will be kept."
    ))) return;

    setBusy(true);
    setError(null);
    try {
      const { data, error: requestError } = await supabase.functions.invoke("manage-google-connection", {
        body: { action: "disconnect" },
      });
      if (requestError || !data?.success) {
        throw new Error(data?.error || requestError?.message || "Unable to disconnect Google");
      }
      setRequiresReconnect(false);
      await loadStatus();
      toast({ title: tr("Google Business déconnecté", "Google Business disconnected") });
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Déconnexion impossible", "Disconnection failed"));
    } finally {
      setBusy(false);
    }
  };

  const connected = !!status?.connected;
  const disabled = busy || isSyncing || checking || isConnecting;
  return (
    <>
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 p-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-sm">{tr("Intégrations", "Integrations")}</h2>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl border border-border bg-white flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold" style={{ color: "#4285F4" }} aria-hidden="true">G</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">Google Business Profile</h3>
                {checking ? <Badge variant="outline">{tr("Vérification…", "Checking…")}</Badge>
                  : connected && !requiresReconnect ? (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/5">
                      <Check className="h-3 w-3 mr-1" />{tr("Compte lié", "Account linked")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">{tr("Non connecté", "Disconnected")}</Badge>
                  )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground mt-1">
                {tr("Synchronisation des établissements et des avis Google.", "Sync Google locations and reviews.")}
              </p>
              {status && <p className="text-xs text-muted-foreground mt-1">
                {status.active_count} / {status.max_businesses} {tr("établissement(s) actif(s)", "active location(s)")}
              </p>}
            </div>
          </div>

          {error && <div role="alert" className="text-xs leading-relaxed rounded-xl bg-destructive/5 text-destructive border border-destructive/20 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" /><span className="flex-1">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadStatus()}>{tr("Vérifier", "Retry")}</Button>
          </div>}
          {requiresReconnect && <p className="text-xs text-amber-700">
            {tr("Google a refusé la synchronisation : autorisez à nouveau l'accès.", "Google refused syncing: grant access again.")}
          </p>}
          <div className="flex flex-wrap gap-2">
            {connected && !requiresReconnect && (
              <Button size="sm" onClick={() => void syncGoogle()} disabled={disabled} className="gap-1.5">
                {isSyncing || busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {tr("Synchroniser", "Sync now")}
              </Button>
            )}
            <Button size="sm" variant={connected && !requiresReconnect ? "outline" : "default"} onClick={() => void connectGoogle()} disabled={disabled}>
              {isConnecting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Link2 className="h-4 w-4 mr-1.5" />}
              {connected ? tr("Reconnecter", "Reconnect") : tr("Connecter Google", "Connect Google")}
            </Button>
            {connected && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1.5" onClick={() => void disconnect()} disabled={disabled}>
              <Link2Off className="h-4 w-4" />{tr("Déconnecter", "Disconnect")}
            </Button>}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {tr("Un nouvel établissement ? Cliquez sur Synchroniser pour le récupérer et le sélectionner selon votre forfait.", "New location? Click Sync to discover it and select it within your plan.")}
          </p>
        </div>
      </div>
      {user && <SelectBusinessesDialog
        open={selectionOpen}
        onOpenChange={setSelectionOpen}
        businesses={availableBusinesses}
        maxBusinesses={selectionLimit}
        initialSelectedGooglePlaceIds={initialSelectedIds}
        userId={user.id}
        onSuccess={selectionSaved}
      />}
    </>
  );
}
