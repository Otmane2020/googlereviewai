import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Extend ServiceWorkerRegistration for PushManager
declare global {
  interface ServiceWorkerRegistration {
    pushManager: PushManager;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useWebPush = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [loading, setLoading] = useState(false);

  // Check support and existing subscription
  useEffect(() => {
    const check = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setIsSupported(false);
        setPermission("unsupported");
        return;
      }
      setIsSupported(true);
      setPermission(Notification.permission);

      try {
        const reg = await navigator.serviceWorker.getRegistration("/");
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!sub);
        }
      } catch (e) {
        console.warn("[WebPush] Error checking subscription:", e);
      }
    };
    check();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported) return false;
    setLoading(true);

    try {
      // 1. Get VAPID public key from edge function
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke(
        "register-push-subscription",
        { body: { action: "get-vapid-key" } }
      );

      if (vapidError || !vapidData?.vapidPublicKey) {
        console.error("[WebPush] Failed to get VAPID key:", vapidError);
        setLoading(false);
        return false;
      }

      // 2. Register/get service worker
      let reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
      }

      // 2b. Clean any stale subscription (e.g. legacy FCM endpoints) before resubscribing
      try {
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          // Notify backend to remove old record
          await supabase.functions.invoke("register-push-subscription", {
            body: { action: "unsubscribe", subscription: { endpoint: existing.endpoint } },
          });
          await existing.unsubscribe();
        }
      } catch (e) {
        console.warn("[WebPush] Could not clear stale subscription:", e);
      }

      // 3. Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidData.vapidPublicKey);
      const pushSubscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // 4. Send subscription to backend
      const subJson = pushSubscription.toJSON();
      const { error: regError } = await supabase.functions.invoke(
        "register-push-subscription",
        {
          body: {
            action: "subscribe",
            subscription: {
              endpoint: subJson.endpoint,
              keys: {
                p256dh: subJson.keys?.p256dh,
                auth: subJson.keys?.auth,
              },
            },
          },
        }
      );

      if (regError) {
        console.error("[WebPush] Failed to register subscription:", regError);
        setLoading(false);
        return false;
      }

      setIsSubscribed(true);
      setPermission("granted");
      console.log("[WebPush] ✅ Subscribed successfully");
      setLoading(false);
      return true;
    } catch (e) {
      console.error("[WebPush] Subscribe error:", e);
      if (Notification.permission === "denied") {
        setPermission("denied");
      }
      setLoading(false);
      return false;
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Notify backend
          await supabase.functions.invoke("register-push-subscription", {
            body: {
              action: "unsubscribe",
              subscription: { endpoint: sub.endpoint },
            },
          });
          await sub.unsubscribe();
        }
      }
      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (e) {
      console.error("[WebPush] Unsubscribe error:", e);
      setLoading(false);
      return false;
    }
  }, [user]);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: user.id,
          title: "🔔 Test Starlinko",
          body: "Les notifications push fonctionnent correctement !",
          icon: "/icon-512x512.png",
          url: "/settings",
        },
      });

      setLoading(false);
      if (error) {
        console.error("[WebPush] Test notification error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("[WebPush] Test notification error:", e);
      setLoading(false);
      return false;
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
};
