import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { X, Bell, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    PushAlertCo?: {
      forceSubscribe: (callbacks?: { onSuccess?: () => void; onFailure?: () => void }) => void;
      getSubsInfo: () => { status: string };
    };
  }
}

// Pages where the notification prompt should appear
const ALLOWED_ROUTES = ["/dashboard", "/reviews", "/ai-settings", "/settings", "/businesses", "/seo-autopost", "/aeo-rank", "/maps-rank", "/notifications"];

export const NotificationPrompt = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { isInstalled, isStandalone, isIOS, canInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showDelayed, setShowDelayed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);

  // Check notification permission and PushAlert subscription status
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }

    // Check PushAlert subscription status
    const checkSubscription = () => {
      if (window.PushAlertCo) {
        try {
          const info = window.PushAlertCo.getSubsInfo();
          if (info?.status === "subscribed") {
            setIsAlreadySubscribed(true);
          }
        } catch (e) {
          // SDK not ready yet
        }
      }
    };

    // Check immediately and after a delay (SDK may not be ready)
    checkSubscription();
    const timeout = setTimeout(checkSubscription, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Check if we're on an allowed route
  const isAllowedRoute = ALLOWED_ROUTES.some(route => location.pathname.startsWith(route));

  // Check if already dismissed
  useEffect(() => {
    const lastDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      // Don't show for 24 hours after dismissal
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setDismissed(true);
      } else {
        localStorage.removeItem("notification-prompt-dismissed");
      }
    }
  }, []);

  // Show prompt after install prompt is dismissed or after delay
  useEffect(() => {
    const installPromptDismissed = localStorage.getItem("install-prompt-dismissed");
    const isInstallPromptActive = !isInstalled && !isStandalone && (canInstall || isIOS);
    
    const wasInstallDismissedRecently = installPromptDismissed && 
      (Date.now() - parseInt(installPromptDismissed, 10) < 24 * 60 * 60 * 1000);

    // If install prompt is active and not dismissed, wait longer
    if (isInstallPromptActive && !wasInstallDismissedRecently) {
      // Wait 8 seconds if install banner is showing
      const timeout = setTimeout(() => setShowDelayed(true), 8000);
      return () => clearTimeout(timeout);
    } else {
      // Show after 3 seconds if no install banner
      const timeout = setTimeout(() => setShowDelayed(true), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isInstalled, isStandalone, canInstall, isIOS]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString());
  };

  const handleSubscribe = () => {
    setIsSubscribing(true);
    
    if (window.PushAlertCo) {
      window.PushAlertCo.forceSubscribe({
        onSuccess: () => {
          setIsSubscribing(false);
          setIsAlreadySubscribed(true);
          setDismissed(true);
          toast({
            title: "Notifications activées",
            description: "Vous recevrez les alertes pour vos avis Google",
          });
        },
        onFailure: () => {
          setIsSubscribing(false);
          toast({
            title: "Notifications non activées",
            description: "Vous pouvez les activer plus tard dans les paramètres",
            variant: "destructive",
          });
        }
      });
    } else {
      // Fallback: request native permission
      Notification.requestPermission().then((result) => {
        setIsSubscribing(false);
        setPermission(result);
        if (result === "granted") {
          setDismissed(true);
          toast({
            title: "Notifications activées",
            description: "Vous recevrez les alertes pour vos avis Google",
          });
        }
      });
    }
  };

  // Wait for auth to load
  if (authLoading) return null;

  const isBlocked = permission === "denied";

  // Don't show if already subscribed, dismissed, no user, or not on allowed route
  if (isAlreadySubscribed || (dismissed && !isBlocked) || !user || !isAllowedRoute || !showDelayed) {
    return null;
  }

  // Show blocked message when notifications are denied
  if (isBlocked) {
    return (
      <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-40 animate-fade-in">
        <div className="bg-destructive/10 border-destructive/30 border rounded-2xl shadow-2xl p-4 max-w-sm mx-auto">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl flex-shrink-0 bg-destructive/20">
              <Settings className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Notifications bloquées</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Cliquez sur 🔒 dans la barre d'adresse → Notifications → Autoriser
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="flex-1 h-9"
                  variant="outline"
                >
                  Recharger
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-9 px-3">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bottom notification prompt
  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-40 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl flex-shrink-0 bg-primary/10">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Activer les notifications</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Recevez une alerte à chaque nouvel avis Google
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
                className="h-9 px-4"
                disabled={isSubscribing}
              >
                Plus tard
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubscribe}
                className="flex-1 h-9"
                disabled={isSubscribing}
              >
                {isSubscribing ? "Activation..." : "Activer"}
              </Button>
            </div>
          </div>
          <button 
            onClick={handleDismiss} 
            className="p-1 rounded-lg hover:bg-muted -mt-1 -mr-1"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};
