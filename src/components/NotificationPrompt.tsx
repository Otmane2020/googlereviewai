import { useState, useEffect } from "react";
import { useFirebasePush } from "@/hooks/useFirebasePush";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { X, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const NotificationPrompt = () => {
  const { user } = useAuth();
  const { permission, isSupported, isSubscribed, isLoading, subscribe } = useFirebasePush();
  const { isInstalled, isStandalone, isIOS, canInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showDelayed, setShowDelayed] = useState(false);

  // Check if already dismissed
  useEffect(() => {
    const lastDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      // Don't show for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  // Delay showing this prompt if the install prompt might be visible
  useEffect(() => {
    const installPromptDismissed = localStorage.getItem("install-prompt-dismissed");
    const isInstallPromptActive = !isInstalled && !isStandalone && (canInstall || isIOS);
    
    // Check if install prompt was recently dismissed (within last 24h)
    const wasInstallDismissedRecently = installPromptDismissed && 
      (Date.now() - parseInt(installPromptDismissed, 10) < 24 * 60 * 60 * 1000);

    if (isInstallPromptActive && !wasInstallDismissedRecently) {
      // Install prompt is likely visible, wait for it to be dismissed
      // Check every second if install prompt got dismissed
      const interval = setInterval(() => {
        const currentDismissed = localStorage.getItem("install-prompt-dismissed");
        if (currentDismissed) {
          setShowDelayed(true);
          clearInterval(interval);
        }
      }, 1000);

      // Also show after 30 seconds regardless (in case user ignores install prompt)
      const timeout = setTimeout(() => {
        setShowDelayed(true);
        clearInterval(interval);
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      // No install prompt conflict, show immediately after small delay
      const timeout = setTimeout(() => setShowDelayed(true), 2000);
      return () => clearTimeout(timeout);
    }
  }, [isInstalled, isStandalone, canInstall, isIOS]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString());
  };

  const handleRequestPermission = async () => {
    console.log("[NotificationPrompt] Requesting permission, current state:", permission);
    
    // If permission is denied, show instructions
    if (permission === "denied") {
      toast.error("Notifications bloquées par le navigateur", {
        description: "Cliquez sur 🔒 dans la barre d'adresse → Notifications → Autoriser, puis rechargez la page.",
        duration: 10000,
      });
      return;
    }
    
    const success = await subscribe();
    console.log("[NotificationPrompt] Subscribe result:", success);
    
    if (success) {
      toast.success("Notifications activées ! 🎉", {
        description: "Vous recevrez les alertes même quand l'app est fermée.",
      });
      handleDismiss();
    } else {
      // Check if permission was just denied
      const currentPermission = Notification.permission;
      if (currentPermission === "denied") {
        toast.error("Notifications refusées", {
          description: "Cliquez sur 🔒 → Notifications → Autoriser pour réactiver.",
          duration: 8000,
        });
      } else {
        toast.error("Échec de l'activation", {
          description: "Vérifiez que vous êtes sur la version installée de l'app (PWA).",
        });
      }
    }
  };

  // Show prompt even if denied - we'll show instructions when clicked
  // Don't show if: not supported, already subscribed, user dismissed, no user
  if (!isSupported || isSubscribed || dismissed || !user) {
    return null;
  }

  // Don't show until delayed show is triggered
  if (!showDelayed) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-40 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-accent/20 flex-shrink-0">
            <BellRing className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Activer les notifications</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Soyez alerté dès qu'un nouvel avis est publié, même hors de l'app
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="flex-1 h-9 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Bell className="w-4 h-4 mr-1.5" />
                {isLoading ? "..." : "Activer"}
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
