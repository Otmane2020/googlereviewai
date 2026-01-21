import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useFirebasePush } from "@/hooks/useFirebasePush";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { X, Bell, BellRing, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Pages where the notification prompt should appear
const ALLOWED_ROUTES = ["/dashboard", "/reviews", "/ai-settings", "/settings", "/businesses", "/seo-autopost", "/aeo-rank", "/maps-rank", "/notifications"];

export const NotificationPrompt = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { permission, isSupported, isSubscribed, isLoading, subscribe } = useFirebasePush();
  const { isInstalled, isStandalone, isIOS, canInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showDelayed, setShowDelayed] = useState(false);

  // Check if we're on an allowed route
  const isAllowedRoute = ALLOWED_ROUTES.some(route => location.pathname.startsWith(route));

  // Check if already dismissed (only for 4h now for testing)
  useEffect(() => {
    const lastDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      // Don't show for 4 hours after dismissal (for easier testing)
      if (Date.now() - dismissedTime < 4 * 60 * 60 * 1000) {
        setDismissed(true);
      } else {
        // Clear old dismissal
        localStorage.removeItem("notification-prompt-dismissed");
      }
    }
  }, []);

  // Show prompt after a short delay, coordinating with install prompt
  useEffect(() => {
    const installPromptDismissed = localStorage.getItem("install-prompt-dismissed");
    const isInstallPromptActive = !isInstalled && !isStandalone && (canInstall || isIOS);
    
    const wasInstallDismissedRecently = installPromptDismissed && 
      (Date.now() - parseInt(installPromptDismissed, 10) < 24 * 60 * 60 * 1000);

    if (isInstallPromptActive && !wasInstallDismissedRecently) {
      // Install prompt might be visible, wait for it
      const interval = setInterval(() => {
        const currentDismissed = localStorage.getItem("install-prompt-dismissed");
        if (currentDismissed) {
          setShowDelayed(true);
          clearInterval(interval);
        }
      }, 1000);

      // Show after 15 seconds regardless (reduced from 30)
      const timeout = setTimeout(() => {
        setShowDelayed(true);
        clearInterval(interval);
      }, 15000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      // No install prompt conflict, show immediately after small delay
      const timeout = setTimeout(() => setShowDelayed(true), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isInstalled, isStandalone, canInstall, isIOS]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString());
  };

  const handleActivate = async () => {
    console.log("[NotificationPrompt] Activating Firebase Push...");
    console.log("[NotificationPrompt] Current permission:", permission);
    
    // If permission is denied, show instructions and return
    if (permission === "denied") {
      toast.error("Notifications bloquées par le navigateur", {
        description: "Cliquez sur 🔒 dans la barre d'adresse → Notifications → Autoriser, puis rechargez la page.",
        duration: 10000,
      });
      return;
    }
    
    const success = await subscribe();
    
    if (success) {
      toast.success("Notifications activées ! 🎉", {
        description: "Vous recevrez les alertes même quand l'app est fermée.",
      });
      handleDismiss();
    } else {
      // Check current permission after attempt
      const currentPermission = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
      console.log("[NotificationPrompt] Permission after attempt:", currentPermission);
      
      if (currentPermission === "denied") {
        toast.error("Notifications bloquées", {
          description: "Cliquez sur 🔒 dans la barre d'adresse → Notifications → Autoriser, puis rechargez.",
          duration: 10000,
        });
      } else {
        toast.error("Échec de l'activation", {
          description: "Erreur technique. Consultez la console (F12) pour plus de détails.",
          duration: 8000,
        });
      }
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("[NotificationPrompt] State:", {
      isSupported,
      isSubscribed,
      dismissed,
      showDelayed,
      user: !!user,
      permission,
    });
  }, [isSupported, isSubscribed, dismissed, showDelayed, user, permission]);

  // Don't show if: not supported, already subscribed, user dismissed, no user, or not on allowed route
  if (!isSupported || isSubscribed || dismissed || !user || !isAllowedRoute) {
    console.log("[NotificationPrompt] Not showing because:", {
      isSupported,
      isSubscribed,
      dismissed,
      hasUser: !!user,
      isAllowedRoute,
      currentPath: location.pathname,
    });
    return null;
  }

  // Don't show until delayed show is triggered
  if (!showDelayed) {
    return null;
  }

  // Determine if permission is blocked
  const isBlocked = permission === "denied";

  return (
    <div className="fixed top-20 left-4 right-4 z-40 animate-fade-in">
      <div className={`border rounded-2xl shadow-2xl p-4 max-w-sm mx-auto ${
        isBlocked 
          ? "bg-destructive/10 border-destructive/30" 
          : "bg-card border-border"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${
            isBlocked ? "bg-destructive/20" : "bg-accent/20"
          }`}>
            {isBlocked ? (
              <Settings className="w-6 h-6 text-destructive" />
            ) : (
              <BellRing className="w-6 h-6 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              {isBlocked ? "Notifications bloquées" : "Activer les notifications"}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {isBlocked 
                ? "Cliquez sur 🔒 dans la barre d'adresse → Notifications → Autoriser"
                : "Soyez alerté dès qu'un nouvel avis est publié, même hors de l'app"
              }
            </p>
            <div className="flex gap-2">
              {isBlocked ? (
                <Button 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="flex-1 h-9"
                  variant="outline"
                >
                  Recharger après avoir autorisé
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleActivate}
                  disabled={isLoading}
                  className="flex-1 h-9 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Bell className="w-4 h-4 mr-1.5" />
                  {isLoading ? "Activation..." : "Activer"}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-9 px-3">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
