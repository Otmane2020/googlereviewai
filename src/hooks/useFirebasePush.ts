import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BrowserNotificationService } from "@/lib/notificationService";

type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

interface UseFirebasePushReturn {
  permission: PushPermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

// VAPID key for FCM - from Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY = "BGQFbt1RdpEVn504DOoxkQ32sRJM6AL15bsBn7KSFipkO_qvDeSOXiNNv8-zIHCunTZj4RBM7JQmE_-CiEel3HA";

export const useFirebasePush = (): UseFirebasePushReturn => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check support and subscription status
  useEffect(() => {
    const checkSupport = async () => {
      const supported = BrowserNotificationService.isSupported() && "PushManager" in window;

      console.log("[useFirebasePush] Support check:", { 
        supported, 
        hasNotification: "Notification" in window,
        hasServiceWorker: "serviceWorker" in navigator,
        hasPushManager: "PushManager" in window
      });
      
      setIsSupported(supported);

      if (supported) {
        const currentPermission = BrowserNotificationService.getPermission() as PushPermissionState;
        console.log("[useFirebasePush] Current permission:", currentPermission);
        setPermission(currentPermission);
        
        // Check if user has FCM token in database
        if (user) {
          console.log("[useFirebasePush] Checking subscription for user:", user.id);
          const { data, error } = await supabase
            .from("push_subscriptions")
            .select("id, endpoint")
            .eq("user_id", user.id)
            .limit(1);
          
          if (error) {
            console.error("[useFirebasePush] Error checking subscription:", error);
          }
          
          const hasSubscription = data && data.length > 0;
          console.log("[useFirebasePush] Has subscription:", hasSubscription);
          setIsSubscribed(hasSubscription);
        }
      } else {
        setPermission("unsupported");
      }
    };

    checkSupport();
  }, [user]);

  // Subscribe to FCM
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log("[useFirebasePush] Subscribe called");
    console.log("[useFirebasePush] State:", { isSupported, hasUser: !!user });
    
    if (!isSupported) {
      console.error("[useFirebasePush] Push not supported");
      return false;
    }
    
    if (!user) {
      console.error("[useFirebasePush] No user logged in");
      return false;
    }

    setIsLoading(true);

    try {
      // Step 1: Check if service worker is registered
      console.log("[useFirebasePush] Step 1: Checking service worker...");
      let swRegistration: ServiceWorkerRegistration | null = null;
      
      try {
        swRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
        console.log("[useFirebasePush] SW already registered:", !!swRegistration);
        
        if (!swRegistration) {
          console.log("[useFirebasePush] Registering firebase SW...");
          swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("[useFirebasePush] Firebase SW registered:", swRegistration.scope);
        }
      } catch (swError) {
        console.error("[useFirebasePush] Service worker error:", swError);
      }

      // Step 2: Request permission
      console.log("[useFirebasePush] Step 2: Requesting permission...");
      console.log("[useFirebasePush] Current Notification.permission:", Notification.permission);
      
      const permissionResult = await BrowserNotificationService.requestPermission();
      console.log("[useFirebasePush] Permission result:", permissionResult);
      setPermission(permissionResult as PushPermissionState);
      
      if (permissionResult !== "granted") {
        console.error("[useFirebasePush] Permission not granted:", permissionResult);
        return false;
      }

      // Step 3: Get FCM token
      console.log("[useFirebasePush] Step 3: Getting FCM token...");
      console.log("[useFirebasePush] VAPID key:", VAPID_KEY.substring(0, 20) + "...");
      
      const { getFCMToken } = await import("@/lib/firebase");
      const fcmToken = await getFCMToken(VAPID_KEY);
      
      if (!fcmToken) {
        console.error("[useFirebasePush] Failed to get FCM token - this usually means:");
        console.error("  1. The VAPID key doesn't match Firebase console");
        console.error("  2. The service worker failed to register");
        console.error("  3. Firebase is blocked by the browser");
        
        // Show test notification to confirm browser notifications work
        BrowserNotificationService.showNotification("Configuration en cours...", {
          body: "Les notifications navigateur fonctionnent. Configuration FCM en cours...",
        });
        return false;
      }

      console.log("[useFirebasePush] FCM Token obtained successfully!");
      console.log("[useFirebasePush] Token preview:", fcmToken.substring(0, 50) + "...");

      // Step 4: Delete old subscriptions
      console.log("[useFirebasePush] Step 4: Cleaning old subscriptions...");
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);
      
      if (deleteError) {
        console.warn("[useFirebasePush] Delete warning (non-critical):", deleteError);
      }

      // Step 5: Store new FCM token
      console.log("[useFirebasePush] Step 5: Saving new subscription...");
      const { error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          endpoint: fcmToken,
          p256dh: "fcm",
          auth: "fcm",
        });

      if (error) {
        console.error("[useFirebasePush] Database error:", error);
        console.error("[useFirebasePush] Error details:", JSON.stringify(error, null, 2));
        return false;
      }

      console.log("[useFirebasePush] ✅ Subscription saved successfully!");
      setIsSubscribed(true);
      
      // Show confirmation notification
      BrowserNotificationService.showNotification("Notifications activées ✅", {
        body: "Vous recevrez les alertes même quand l'app est fermée",
      });
      
      return true;
    } catch (error) {
      console.error("[useFirebasePush] Unexpected error:", error);
      console.error("[useFirebasePush] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  // Unsubscribe from FCM
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      // Remove from database
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error removing subscription:", error);
        return false;
      }

      setIsSubscribed(false);
      
      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
};
