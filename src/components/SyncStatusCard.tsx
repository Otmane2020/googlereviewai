import { AlertCircle, CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncReviewsResult } from "@/hooks/useSyncGoogleReviews";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";

interface SyncStatusCardProps {
  lastSyncResult: SyncReviewsResult | null;
  onReconnect?: () => void;
}

export const SyncStatusCard = ({ lastSyncResult, onReconnect }: SyncStatusCardProps) => {
  const { initiateOAuth, isConnecting } = useGoogleOAuth();

  if (!lastSyncResult) return null;

  const hasErrors = lastSyncResult.errors && lastSyncResult.errors.length > 0;
  const requiresReconnect = lastSyncResult.requires_reconnect;

  const handleReconnect = async () => {
    if (onReconnect) {
      onReconnect();
    } else {
      // Use custom OAuth flow that stores refresh_token
      await initiateOAuth();
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${
      lastSyncResult.success 
        ? hasErrors 
          ? "bg-warning/10 border-warning/30" 
          : "bg-secondary/10 border-secondary/30"
        : "bg-destructive/10 border-destructive/30"
    }`}>
      <div className="flex items-start gap-3">
        {lastSyncResult.success ? (
          hasErrors ? (
            <AlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
          )
        ) : (
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={`font-medium text-sm ${
              lastSyncResult.success 
                ? hasErrors ? "text-warning" : "text-secondary"
                : "text-destructive"
            }`}>
              Résultat de la synchronisation
            </h4>
            <span className="text-xs text-muted-foreground">
              {lastSyncResult.synced_count} avis
            </span>
          </div>
          
          <p className="text-sm text-foreground mb-2">{lastSyncResult.message}</p>
          
          {hasErrors && (
            <div className="space-y-1 mb-3">
              <p className="text-xs font-medium text-muted-foreground">Erreurs ({lastSyncResult.errors!.length}):</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                {lastSyncResult.errors!.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-destructive">•</span>
                    <span>{error.replace("API_DISABLED: ", "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {requiresReconnect && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 mt-2"
              onClick={handleReconnect}
              disabled={isConnecting}
            >
              <LogIn className="w-4 h-4" />
              {isConnecting ? "Connexion..." : "Reconnecter Google"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
