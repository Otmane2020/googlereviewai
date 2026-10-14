import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
          // Legacy FCM endpoints are decommissioned — treat as not subscribed
          const isLegacyFcm = sub?.endpoint?.includes("fcm.googleapis.com/fcm/send/");
          setIsSubscribed(!!sub && !isLegacyFcm);
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

      // Reuse a valid browser subscription; do not silently rotate it on each click.
      let pushSubscription = await reg.pushManager.getSubscription();
      if (pushSubscription?.endpoint.includes("fcm.googleapis.com/fcm/send/")) {
        await supabase.functions.invoke("register-push-subscription", {
          body: { action: "unsubscribe", subscription: { endpoint: pushSubscription.endpoint } },
        });
        await pushSubscription.unsubscribe();
        pushSubscription = null;
      }

      if (!pushSubscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidData.vapidPublicKey);
        pushSubscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
      }

      // 4. Send subscription to backend
      const subJson = pushSubscription.toJSON();
      const { data: regData, error: regError } = await supabase.functions.invoke(
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

      if (regError || !regData?.success) {
        console.error("[WebPush] Failed to register subscription:", regError || regData);
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
          const { data, error } = await supabase.functions.invoke("register-push-subscription", {
            body: {
              action: "unsubscribe",
              subscription: { endpoint: sub.endpoint },
            },
          });
          if (error || !data?.success) throw error || new Error("Unable to unregister push subscription");
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
      // The authenticated test endpoint verifies the caller and relays server-side.
      const { data, error } = await supabase.functions.invoke("test-push-notification", {
        body: {},
      });

      setLoading(false);
      if (error || !data?.success || !(data.sent > 0)) {
        console.error("[WebPush] Test notification error:", error || data);
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
