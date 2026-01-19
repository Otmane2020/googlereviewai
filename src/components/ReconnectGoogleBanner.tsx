import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";

interface ReconnectGoogleBannerProps {
  className?: string;
}

export const ReconnectGoogleBanner = ({ className }: ReconnectGoogleBannerProps) => {
  const { initiateOAuth, checkOAuthStatus, isConnecting, isCheckingStatus } = useGoogleOAuth();
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkOAuthStatus();
      setNeedsReconnect(status.requiresReconnect);
      setIsConnected(status.isConnected);
    };
    checkStatus();
  }, [checkOAuthStatus]);

  if (isCheckingStatus) {
    return null;
  }

  if (isConnected && !needsReconnect) {
    return null; // Already connected, no banner needed
  }

  return (
    <Alert 
      variant="destructive" 
      className={`border-orange-500 bg-orange-50 dark:bg-orange-950/20 ${className || ''}`}
    >
      <AlertTriangle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-orange-700 dark:text-orange-300">
          Connectez votre compte Google Business pour activer la synchronisation automatique des avis.
        </span>
        <Button
          size="sm"
          onClick={initiateOAuth}
          disabled={isConnecting}
          className="ml-4 bg-orange-500 hover:bg-orange-600"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Connexion...
            </>
          ) : (
            "Connecter Google"
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export const GoogleConnectionStatus = () => {
  const { checkOAuthStatus, isCheckingStatus } = useGoogleOAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const result = await checkOAuthStatus();
      setIsConnected(result.isConnected);
    };
    checkStatus();
  }, [checkOAuthStatus]);

  if (isCheckingStatus) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Vérification...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Google Business connecté</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-orange-500">
      <AlertTriangle className="h-4 w-4" />
      <span>Non connecté</span>
    </div>
  );
};
