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
  const [syncInfo, setSyncInfo] = useState<{
    auto_sync_reviews: boolean | null;
    last_sync_at: string | null;
    last_sync_status: string | null;
    last_sync_error: string | null;
  } | null>(null);

  const loadStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    const syncQuery = supabase.from("ai_settings")
      .select("auto_sync_reviews,last_sync_at,last_sync_status,last_sync_error")
      .eq("user_id", user.id).maybeSingle();
    // Read safe, authenticated status directly from the database.
    // The original edge function isn't always deployed with the web build,
    // which previously made an existing Google connection look disconnected.
    const { data, error: requestError } = await (supabase as any)
      .rpc("get_my_google_connection_status");
    if (requestError || !data?.success) {
      setStatus(null);
      setError(requestError?.message || tr("Statut Google temporairement indisponible. Réessayez.", "Google status temporarily unavailable. Please retry."));
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
    const syncState = await syncQuery;
    setSyncInfo(syncState.data || null);
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
      await loadStatus();
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
      let localOnly = false;
      if (requestError || !data?.success) {
        // When the Edge Function is not deployed, disconnect locally through
        // the authenticated RPC. It does not pretend Google revoked the token.
        const fallback = await (supabase as any).rpc("disconnect_my_google_connection");
        if (fallback.error || !fallback.data?.success) {
          throw new Error(fallback.error?.message || data?.error || requestError?.message || "Unable to disconnect Google");
        }
        localOnly = true;
      }
      setRequiresReconnect(false);
      await loadStatus();
      onBusinessesChanged?.();
      toast({
        title: tr("Google Business déconnecté", "Google Business disconnected"),
        description: localOnly
          ? tr("Accès supprimé de cette application. Pour révoquer aussi l'autorisation côté Google, ouvrez la sécurité de votre compte Google.", "Access removed from this app. To revoke Google's authorization too, open your Google Account security settings.")
          : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Déconnexion impossible", "Disconnection failed"));
    } finally {
      setBusy(false);
    }
  };

  const connected = !!status?.connected;
  const unknown = !checking && !status;
  const disabled = busy || isSyncing || checking || isConnecting;
  return (
    <>
      <section className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3.5 sm:px-5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-sm">{tr("Intégrations", "Integrations")}</h2>
        </div>
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl border border-border bg-white flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold" style={{ color: "#4285F4" }} aria-hidden="true">G</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <h3 className="font-semibold text-sm text-foreground">Google Business Profile</h3>
                {checking ? (
                  <Badge variant="outline"><Loader2 className="h-3 w-3 animate-spin mr-1" />{tr("Vérification", "Checking")}</Badge>
                ) : unknown ? (
                  <Badge variant="outline" className="text-amber-700">{tr("Statut inconnu", "Status unavailable")}</Badge>
                ) : connected && !requiresReconnect ? (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/5">
                    <Check className="h-3 w-3 mr-1" />{tr("Autorisation enregistrée", "Authorization saved")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{tr("Reconnexion nécessaire", "Reconnect required")}</Badge>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground mt-1">
                {tr("Synchronisez vos fiches et avis Google. L'autorisation enregistrée n'est pas un test d'accès Google en direct.",
                  "Sync Google locations and reviews. A saved authorization does not confirm live Google API access.")}
              </p>
              {status && (
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {status.active_count} / {status.max_businesses} {tr("établissement(s) géré(s)", "managed location(s)")}
                </p>
              )}
              {syncInfo && (
                <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground space-y-0.5">
                  <p>
                    {tr("Synchronisation automatique", "Automatic review sync")}:{" "}
                    <span className="font-semibold text-foreground">
                      {syncInfo.auto_sync_reviews ? tr("activée", "enabled") : tr("désactivée", "disabled")}
                    </span>
                  </p>
                  <p>{tr("Dernier passage", "Last sync")}: {syncInfo.last_sync_at
                    ? new Date(syncInfo.last_sync_at).toLocaleString(isEN ? "en-US" : "fr-FR")
                    : tr("aucun", "none")}</p>
                  {syncInfo.last_sync_status && <p>{tr("Statut", "Status")}: {syncInfo.last_sync_status}</p>}
                  {syncInfo.last_sync_error && <p className="text-destructive break-words">{syncInfo.last_sync_error}</p>}
                </div>
              )}
            </div>
          </div>

          {error && <div role="alert" className="text-xs leading-relaxed rounded-xl bg-amber-500/5 text-amber-800 dark:text-amber-200 border border-amber-500/25 px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1 min-w-0 break-words">{error}</span>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 h-8" onClick={() => void loadStatus()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />{tr("Réessayer", "Retry")}
            </Button>
          </div>}
          {requiresReconnect && <p className="text-xs text-amber-700 dark:text-amber-300">
            {tr("Google a refusé la synchronisation. Autorisez à nouveau l'accès.", "Google refused syncing. Reauthorize access.")}
          </p>}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(connected || unknown) && !requiresReconnect && (
              <Button type="button" size="sm" variant="default" onClick={() => void syncGoogle()} disabled={disabled} className="w-full sm:w-auto gap-1.5">
                {isSyncing || busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {tr("Synchroniser", "Sync now")}
              </Button>
            )}
            <Button type="button" size="sm" variant={connected || unknown ? "outline" : "default"}
              onClick={() => void connectGoogle()} disabled={disabled} className="w-full sm:w-auto gap-1.5">
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {connected || unknown ? tr("Reconnecter", "Reconnect") : tr("Connecter", "Connect")}
            </Button>
            {connected && (
              <Button type="button" size="sm" variant="ghost"
                className="col-span-2 sm:col-span-1 justify-start w-full sm:w-auto text-destructive hover:text-destructive gap-1.5"
                disabled={disabled} onClick={() => void disconnect()}>
                <Link2Off className="h-4 w-4" />{tr("Déconnecter", "Disconnect")}
              </Button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {tr("Nouvel établissement ? Synchronisez, puis sélectionnez les fiches à gérer selon votre forfait.",
              "New location? Sync, then choose the locations to manage within your plan.")}
          </p>
        </div>
      </section>
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
