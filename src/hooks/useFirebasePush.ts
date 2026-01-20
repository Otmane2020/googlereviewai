import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
      const supported = 
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      console.log("[useFirebasePush] Checking support:", { supported });
      setIsSupported(supported);

      if (supported) {
        const currentPermission = Notification.permission as PushPermissionState;
        console.log("[useFirebasePush] Permission status:", currentPermission);
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
          console.log("[useFirebasePush] Has subscription:", hasSubscription, data);
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
    console.log("[useFirebasePush] subscribe called", { isSupported, user: !!user });
    
    if (!isSupported) {
      console.error("[useFirebasePush] Push not supported");
      return false;
    }
    
    if (!user) {
      console.error("[useFirebasePush] No user");
      return false;
    }

    setIsLoading(true);

    try {
      // First, request notification permission explicitly
      console.log("[useFirebasePush] Requesting notification permission...");
      const permissionResult = await Notification.requestPermission();
      console.log("[useFirebasePush] Permission result:", permissionResult);
      setPermission(permissionResult as PushPermissionState);
      
      if (permissionResult !== "granted") {
        console.error("[useFirebasePush] Permission denied by user");
        return false;
      }

      console.log("[useFirebasePush] Importing firebase...");
      const { getFCMToken } = await import("@/lib/firebase");
      
      console.log("[useFirebasePush] Getting FCM token with VAPID key...");
      const fcmToken = await getFCMToken(VAPID_KEY);
      
      if (!fcmToken) {
        console.error("[useFirebasePush] Failed to get FCM token - check browser console for details");
        return false;
      }

      console.log("[useFirebasePush] FCM Token obtained:", fcmToken.substring(0, 30) + "...");

      // Delete old subscriptions first to avoid conflicts
      console.log("[useFirebasePush] Deleting old subscriptions...");
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);
      
      if (deleteError) {
        console.error("[useFirebasePush] Delete error:", deleteError);
      }

      // Store FCM token in database
      console.log("[useFirebasePush] Inserting new subscription...");
      const { error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          endpoint: fcmToken, // Store FCM token as endpoint
          p256dh: "fcm", // Marker to identify FCM tokens
          auth: "fcm",
        });

      if (error) {
        console.error("[useFirebasePush] Insert error:", error);
        return false;
      }

      console.log("[useFirebasePush] FCM token stored successfully");
      setIsSubscribed(true);
      
      return true;
    } catch (error) {
      console.error("[useFirebasePush] Error subscribing to FCM:", error);
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
