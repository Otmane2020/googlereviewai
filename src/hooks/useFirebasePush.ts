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
      // Request permission using our service
      console.log("[useFirebasePush] Requesting permission...");
      const permissionResult = await BrowserNotificationService.requestPermission();
      console.log("[useFirebasePush] Permission result:", permissionResult);
      setPermission(permissionResult as PushPermissionState);
      
      if (permissionResult !== "granted") {
        console.error("[useFirebasePush] Permission not granted:", permissionResult);
        return false;
      }

      // Get FCM token
      console.log("[useFirebasePush] Getting FCM token...");
      const { getFCMToken } = await import("@/lib/firebase");
      const fcmToken = await getFCMToken(VAPID_KEY);
      
      if (!fcmToken) {
        console.error("[useFirebasePush] Failed to get FCM token");
        // Show test notification to confirm browser notifications work
        BrowserNotificationService.showNotification("Test de notification", {
          body: "Les notifications navigateur fonctionnent, mais FCM a échoué.",
        });
        return false;
      }

      console.log("[useFirebasePush] FCM Token obtained:", fcmToken.substring(0, 30) + "...");

      // Delete old subscriptions first
      console.log("[useFirebasePush] Cleaning old subscriptions...");
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      // Store FCM token in database
      console.log("[useFirebasePush] Saving new subscription...");
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
        return false;
      }

      console.log("[useFirebasePush] ✅ Subscription saved successfully");
      setIsSubscribed(true);
      
      // Show confirmation notification
      BrowserNotificationService.showNotification("Notifications activées ✅", {
        body: "Vous recevrez les alertes même quand l'app est fermée",
      });
      
      return true;
    } catch (error) {
      console.error("[useFirebasePush] Error:", error);
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
