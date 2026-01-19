import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { X, Bell, BellRing } from "lucide-react";

export const NotificationPrompt = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

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
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);
    
    if (granted) {
      // Show a test notification
      new Notification("Notifications activées ! 🎉", {
        body: "Vous recevrez maintenant les alertes pour vos nouveaux avis.",
        icon: "/icon-512x512.png",
      });
      handleDismiss();
    }
  };

  // Don't show if not supported, already granted/denied, or dismissed
  if (!isSupported || permission !== "default" || dismissed) {
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
              Soyez alerté dès qu'un nouvel avis est publié
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="flex-1 h-9 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Bell className="w-4 h-4 mr-1.5" />
                {isRequesting ? "..." : "Activer"}
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
