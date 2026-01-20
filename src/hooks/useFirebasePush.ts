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

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission as PushPermissionState);
        
        // Check if user has FCM token in database
        if (user) {
          const { data } = await supabase
            .from("push_subscriptions")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);
          
          setIsSubscribed(data && data.length > 0);
        }
      } else {
        setPermission("unsupported");
      }
    };

    checkSupport();
  }, [user]);

  // Subscribe to FCM
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);

    try {
      const { getFCMToken } = await import("@/lib/firebase");
      const fcmToken = await getFCMToken(VAPID_KEY);
      
      if (!fcmToken) {
        console.error("Failed to get FCM token");
        return false;
      }

      // Store FCM token in database
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: fcmToken, // Store FCM token as endpoint
          p256dh: "fcm", // Marker to identify FCM tokens
          auth: "fcm",
        }, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Error storing FCM token:", error);
        return false;
      }

      setIsSubscribed(true);
      setPermission("granted");
      
      return true;
    } catch (error) {
      console.error("Error subscribing to FCM:", error);
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
