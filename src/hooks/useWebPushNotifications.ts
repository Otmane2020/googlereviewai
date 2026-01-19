import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

interface UseWebPushReturn {
  permission: PushPermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export const useWebPushNotifications = (): UseWebPushReturn => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if Web Push is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission as PushPermissionState);

        // Check if already subscribed
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      } else {
        setPermission("unsupported");
      }
    };

    checkSupport();
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      // Register the custom SW for push
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Wait for the SW to be ready
      await navigator.serviceWorker.ready;

      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }, []);

  // Get VAPID public key from backend
  const getVapidPublicKey = useCallback(async (): Promise<string | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        console.error("No session for VAPID key request");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("register-push-subscription", {
        body: { action: "get-vapid-key" },
      });

      if (error) {
        console.error("Error getting VAPID key:", error);
        return null;
      }

      return data?.vapidPublicKey || null;
    } catch (error) {
      console.error("Error fetching VAPID key:", error);
      return null;
    }
  }, []);

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PushPermissionState);

      if (permissionResult !== "granted") {
        console.log("Notification permission denied");
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) return false;

      // Get VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        console.error("No VAPID public key available");
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("Push subscription:", subscription);

      // Send subscription to backend
      const { error } = await supabase.functions.invoke("register-push-subscription", {
        body: {
          action: "subscribe",
          subscription: subscription.toJSON(),
        },
      });

      if (error) {
        console.error("Error registering subscription:", error);
        return false;
      }

      setIsSubscribed(true);
      console.log("Successfully subscribed to push notifications");
      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user, registerServiceWorker, getVapidPublicKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from backend
        await supabase.functions.invoke("register-push-subscription", {
          body: {
            action: "unsubscribe",
            subscription: { endpoint: subscription.endpoint },
          },
        });
      }

      setIsSubscribed(false);
      console.log("Successfully unsubscribed from push notifications");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
};
