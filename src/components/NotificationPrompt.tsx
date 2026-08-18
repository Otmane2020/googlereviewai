import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePWA } from "@/hooks/usePWA";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useWebPush } from "@/hooks/useWebPush";
import { Button } from "@/components/ui/button";
import { X, Bell, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    PushAlertCo?: {
      forceSubscribe: (callbacks?: { onSuccess?: () => void; onFailure?: () => void }) => void;
      getSubsInfo: () => { status: string; subs_id?: string };
    };
  }
}

// Pages where the notification prompt should appear
const ALLOWED_ROUTES = ["/dashboard", "/reviews", "/ai-settings", "/settings", "/businesses", "/seo-autopost", "/aeo-rank", "/maps-rank", "/notifications"];

export const NotificationPrompt = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { isInstalled, isStandalone, isIOS, canInstall } = usePWA();
  const { isNativeApp } = useDeviceDetection();
  const { isSubscribed: webPushSubscribed, subscribe: webPushSubscribe, permission: webPushPermission, loading: webPushLoading } = useWebPush();
  const [dismissed, setDismissed] = useState(false);
  const [showDelayed, setShowDelayed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);

  // Sync state with native web push hook
  useEffect(() => {
    if (webPushSubscribed) setIsAlreadySubscribed(true);
  }, [webPushSubscribed]);
  useEffect(() => {
    setPermission(webPushPermission);
  }, [webPushPermission]);

  // ✅ All hooks MUST be called before any conditional return
  // Check notification permission and PushAlert subscription status
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }

    // Check PushAlert subscription status and register if subscribed but not registered
    const checkAndRegisterSubscription = async () => {
      console.log("[NotificationPrompt] Checking PushAlert status...", { 
        hasPushAlertCo: !!window.PushAlertCo, 
        hasUser: !!user 
      });
      
      if (window.PushAlertCo && user) {
        try {
          const info = window.PushAlertCo.getSubsInfo();
          console.log("[NotificationPrompt] PushAlert info:", info);
          
          if (info?.status === "subscribed") {
            setIsAlreadySubscribed(true);
            
            // If subscribed, ensure subscriber ID is registered in our backend
            if (info.subs_id) {
              console.log("[NotificationPrompt] User subscribed, registering ID:", info.subs_id);
              await registerSubscriberId(info.subs_id);
            } else {
              console.warn("[NotificationPrompt] Subscribed but no subs_id available");
            }
          } else if (info?.status === "no_init" || info?.status === "unsubscribed") {
            // SDK not initialized or user unsubscribed - clear invalid subscriber_id from DB
            console.log("[NotificationPrompt] SDK status:", info.status, "- clearing old subscriber_id and showing prompt");
            setIsAlreadySubscribed(false);
            
            // Clear potentially invalid subscriber_id from database
            try {
              const { supabase } = await import("@/integrations/supabase/client");
              await supabase
                .from("profiles")
                .update({ pushalert_subscriber_id: null })
                .eq("id", user.id);
              console.log("[NotificationPrompt] Cleared old subscriber_id from database");
            } catch (e) {
              console.error("[NotificationPrompt] Error clearing subscriber_id:", e);
            }
          }
        } catch (e) {
          console.log("[NotificationPrompt] SDK not ready yet:", e);
        }
      }
    };

    // Check multiple times as SDK may take time to initialize
    const timeout1 = setTimeout(checkAndRegisterSubscription, 1000);
    const timeout2 = setTimeout(checkAndRegisterSubscription, 3000);
    const timeout3 = setTimeout(checkAndRegisterSubscription, 6000);
    const timeout4 = setTimeout(checkAndRegisterSubscription, 10000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, [user]);

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

  // ✅ All conditional returns AFTER hooks
  // Don't show in native app - notifications are handled by Android system
  if (isNativeApp) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", Date.now().toString());
  };

  // Register PushAlert subscriber ID with our backend
  const registerSubscriberId = async (subscriberId: string) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error("[PushAlert] No session for registering subscriber");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-pushalert-subscriber`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ subscriber_id: subscriberId }),
        }
      );

      if (response.ok) {
        console.log("[PushAlert] ✅ Subscriber ID registered successfully:", subscriberId);
      } else {
        const error = await response.json();
        console.error("[PushAlert] Failed to register subscriber:", error);
      }
    } catch (error) {
      console.error("[PushAlert] Error registering subscriber:", error);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      // iOS Safari requires PWA install before push works
      if (isIOS && !isStandalone && !isInstalled) {
        toast({
          title: "Installez l'app d'abord",
          description: "Sur iPhone, ajoutez GoogleReviewAI à l'écran d'accueil pour activer les notifications.",
          variant: "destructive",
        });
        setIsSubscribing(false);
        return;
      }

      const ok = await webPushSubscribe();
      setIsSubscribing(false);

      if (ok) {
        setIsAlreadySubscribed(true);
        setDismissed(true);
        toast({
          title: "Notifications activées",
          description: "Vous recevrez une alerte à chaque nouvel avis Google.",
        });
      } else {
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          setPermission("denied");
          toast({
            title: "Notifications bloquées",
            description: "Autorisez les notifications dans les réglages du navigateur.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Activation impossible",
            description: "Vérifiez votre navigateur ou réessayez plus tard.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      setIsSubscribing(false);
      console.error("[NotificationPrompt] Subscribe error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer les notifications.",
        variant: "destructive",
      });
    }
  };

  // Wait for auth to load
  if (authLoading) return null;

  const isBlocked = permission === "denied";

  // Don't show if already subscribed, dismissed, no user, or not on allowed route
  if (isAlreadySubscribed || dismissed || !user || !isAllowedRoute || !showDelayed) {
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
              <h3 className="font-semibold text-sm mb-1">Notifications blocked</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Click 🔒 in the address bar → Notifications → Allow
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="flex-1 h-9"
                  variant="outline"
                >
                  Reload
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
            <h3 className="font-semibold text-sm mb-1">Enable notifications</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get an alert for every new Google review
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
                className="h-9 px-4"
                disabled={isSubscribing}
              >
                Later
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubscribe}
                className="flex-1 h-9"
                disabled={isSubscribing}
              >
                {isSubscribing ? "Enabling..." : "Enable"}
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
