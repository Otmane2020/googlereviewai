import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

interface UseNativePushReturn {
  permission: PushPermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  isTesting: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  testNotification: () => Promise<boolean>;
}

export const useNativePush = (): UseNativePushReturn => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Check support and subscription status
  useEffect(() => {
    const checkSupport = async () => {
      const hasNotification = "Notification" in window;
      const hasServiceWorker = "serviceWorker" in navigator;
      const hasPushManager = "PushManager" in window;
      const supported = hasNotification && hasServiceWorker && hasPushManager;

      console.log("[useNativePush] Support check:", { supported, hasNotification, hasServiceWorker, hasPushManager });
      setIsSupported(supported);

      if (supported) {
        const currentPermission = Notification.permission as PushPermissionState;
        console.log("[useNativePush] Current permission:", currentPermission);
        setPermission(currentPermission);
        
        // Check if user has subscription in database
        if (user) {
          console.log("[useNativePush] Checking subscription for user:", user.id);
          const { data, error } = await supabase
            .from("push_subscriptions")
            .select("id, endpoint")
            .eq("user_id", user.id)
            .limit(1);
          
          if (error) {
            console.error("[useNativePush] Error checking subscription:", error);
          }
          
          const hasSubscription = data && data.length > 0;
          console.log("[useNativePush] Has subscription in DB:", hasSubscription);
          setIsSubscribed(hasSubscription);
        }
      } else {
        setPermission("unsupported");
      }
    };

    checkSupport();
  }, [user]);

  // Get VAPID public key from backend
  const getVapidPublicKey = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("register-push-subscription", {
        body: { action: "get-vapid-key" },
      });

      if (error) {
        console.error("[useNativePush] Error getting VAPID key:", error);
        return null;
      }

      return data?.vapidPublicKey || null;
    } catch (error) {
      console.error("[useNativePush] Error fetching VAPID key:", error);
      return null;
    }
  }, []);

  // Convert VAPID key to Uint8Array for PushManager
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Subscribe to Web Push
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log("[useNativePush] ========== SUBSCRIBE START ==========");
    
    if (!isSupported) {
      console.error("[useNativePush] ❌ Push not supported");
      return false;
    }
    
    if (!user) {
      console.error("[useNativePush] ❌ No user logged in");
      return false;
    }

    setIsLoading(true);

    try {
      // Step 1: Request notification permission
      console.log("[useNativePush] Step 1: Requesting permission...");
      const permissionResult = await Notification.requestPermission();
      console.log("[useNativePush] Permission result:", permissionResult);
      setPermission(permissionResult as PushPermissionState);
      
      if (permissionResult !== "granted") {
        console.error("[useNativePush] ❌ Permission not granted");
        return false;
      }

      // Step 2: Register service worker
      console.log("[useNativePush] Step 2: Registering service worker...");
      let registration: ServiceWorkerRegistration;
      
      try {
        // Unregister any old Firebase SW first
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          const url = reg.active?.scriptURL || reg.installing?.scriptURL || "";
          if (url.includes("firebase-messaging-sw.js")) {
            await reg.unregister();
            console.log("[useNativePush] Unregistered Firebase SW");
          }
        }

        // Register our native push SW
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("[useNativePush] ✅ SW registered:", registration.scope);
        
        await navigator.serviceWorker.ready;
        console.log("[useNativePush] ✅ SW is ready");
      } catch (swError) {
        console.error("[useNativePush] ❌ SW registration failed:", swError);
        return false;
      }

      // Step 3: Get VAPID public key
      console.log("[useNativePush] Step 3: Getting VAPID public key...");
      const vapidPublicKey = await getVapidPublicKey();
      
      if (!vapidPublicKey) {
        console.error("[useNativePush] ❌ No VAPID key available");
        toast.error("Configuration manquante", {
          description: "La clé VAPID n'est pas configurée côté serveur.",
        });
        return false;
      }
      console.log("[useNativePush] ✅ VAPID key obtained");

      // Step 4: Subscribe to push
      console.log("[useNativePush] Step 4: Creating push subscription...");
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      console.log("[useNativePush] ✅ Push subscription created");
      console.log("[useNativePush] Endpoint:", subscription.endpoint);

      // Step 5: Delete old subscriptions for this user
      console.log("[useNativePush] Step 5: Cleaning old subscriptions...");
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      // Step 6: Save subscription to database
      console.log("[useNativePush] Step 6: Saving subscription to database...");
      const subscriptionJson = subscription.toJSON();
      
      const { error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || "",
          auth: subscriptionJson.keys?.auth || "",
        });

      if (error) {
        console.error("[useNativePush] ❌ Database error:", error);
        return false;
      }

      console.log("[useNativePush] ✅ Subscription saved!");
      console.log("[useNativePush] ========== SUBSCRIBE SUCCESS ==========");
      setIsSubscribed(true);
      
      return true;
    } catch (error) {
      console.error("[useNativePush] ❌ Unexpected error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, getVapidPublicKey]);

  // Unsubscribe from Web Push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      console.log("[useNativePush] Unsubscribing...");
      
      // Unsubscribe from browser
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log("[useNativePush] ✅ Browser subscription removed");
      }

      // Remove from database
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("[useNativePush] Error removing subscription:", error);
        return false;
      }

      console.log("[useNativePush] ✅ Unsubscribed successfully");
      setIsSubscribed(false);
      
      return true;
    } catch (error) {
      console.error("[useNativePush] Error unsubscribing:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Test push notification
  const testNotification = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.error("[useNativePush] Cannot test - no user");
      return false;
    }

    setIsTesting(true);

    try {
      console.log("[useNativePush] Sending test notification...");
      
      const { data, error } = await supabase.functions.invoke("test-push-notification", {});

      if (error) {
        console.error("[useNativePush] Test error:", error);
        toast.error("Erreur lors du test", {
          description: error.message,
        });
        return false;
      }

      if (data?.success) {
        if (data.sent > 0) {
          toast.success("Notification envoyée !", {
            description: "Vous devriez la recevoir dans quelques secondes.",
          });
        } else {
          toast.warning("Aucun abonnement trouvé", {
            description: "Activez d'abord les notifications.",
          });
        }
        return data.sent > 0;
      } else {
        toast.error("Échec de l'envoi", {
          description: data?.error || "Erreur inconnue",
        });
        return false;
      }
    } catch (error) {
      console.error("[useNativePush] Test exception:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  }, [user]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    isTesting,
    subscribe,
    unsubscribe,
    testNotification,
  };
};
