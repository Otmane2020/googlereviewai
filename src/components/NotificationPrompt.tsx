import { useState, useEffect } from "react";
import { useWebPushNotifications } from "@/hooks/useWebPushNotifications";
import { Button } from "@/components/ui/button";
import { X, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";

export const NotificationPrompt = () => {
  const { permission, isSupported, isSubscribed, isLoading, subscribe } = useWebPushNotifications();
  const [dismissed, setDismissed] = useState(false);

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

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString());
  };

  const handleRequestPermission = async () => {
    const success = await subscribe();
    
    if (success) {
      toast.success("Notifications activées ! 🎉", {
        description: "Vous recevrez les alertes même quand l'app est fermée.",
      });
      handleDismiss();
    } else if (permission === "denied") {
      toast.error("Notifications bloquées", {
        description: "Activez-les dans les paramètres de votre navigateur.",
      });
    }
  };

  // Don't show if not supported, already subscribed, permission denied, or dismissed
  if (!isSupported || isSubscribed || permission === "denied" || permission === "granted" || dismissed) {
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
