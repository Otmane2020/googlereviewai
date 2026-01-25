import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { X, Bell, BellRing, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Pages where the notification prompt should appear
const ALLOWED_ROUTES = ["/dashboard", "/reviews", "/ai-settings", "/settings", "/businesses", "/seo-autopost", "/aeo-rank", "/maps-rank", "/notifications"];

export const NotificationPrompt = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { isInstalled, isStandalone, isIOS, canInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showDelayed, setShowDelayed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  // Check notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
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

  // Show prompt after a short delay
  useEffect(() => {
    const installPromptDismissed = localStorage.getItem("install-prompt-dismissed");
    const isInstallPromptActive = !isInstalled && !isStandalone && (canInstall || isIOS);
    
    const wasInstallDismissedRecently = installPromptDismissed && 
      (Date.now() - parseInt(installPromptDismissed, 10) < 24 * 60 * 60 * 1000);

    if (isInstallPromptActive && !wasInstallDismissedRecently) {
      const timeout = setTimeout(() => setShowDelayed(true), 15000);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setShowDelayed(true), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isInstalled, isStandalone, canInstall, isIOS]);

  const handleDismiss = () => {
    if (permission === "denied") return;
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString());
  };

  // Wait for auth to load
  if (authLoading) return null;

  const isBlocked = permission === "denied";
  const isGranted = permission === "granted";

  // Don't show if already granted (PushAlert will handle), dismissed, no user, or not on allowed route
  if (isGranted || (dismissed && !isBlocked) || !user || !isAllowedRoute || !showDelayed) {
    return null;
  }

  // PushAlert handles the subscription automatically via its SDK
  // This component just informs users about blocked notifications
  if (!isBlocked) {
    // If not blocked and not granted, PushAlert's native prompt will appear
    return null;
  }

  // Show only when blocked to guide users
  return (
    <div className="fixed top-20 left-4 right-4 z-40 animate-fade-in">
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
                Recharger après avoir autorisé
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
};
