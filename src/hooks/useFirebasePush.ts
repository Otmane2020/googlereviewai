import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

interface UseFirebasePushReturn {
  permission: PushPermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

// VAPID key for FCM - get from Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY = "BLBx-hf5WrFDz3D3hEq3bAJwFhVRpK6cPj8pQqbTqhNJxTOJz8z_qxQrHw8QjqyGvh0xQKjvkK8rFqpJdvqFqZM";

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

  // Setup foreground message listener
  useEffect(() => {
    if (!isSupported) return;

    let unsubscribeFn: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const { setupForegroundMessageListener } = await import("@/lib/firebase");
        unsubscribeFn = await setupForegroundMessageListener((payload) => {
          toast({
            title: payload.notification?.title || "Nouvelle notification",
            description: payload.notification?.body,
          });
        });
      } catch (error) {
        console.error("Error setting up message listener:", error);
      }
    };

    setupListener();

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [isSupported]);

  // Subscribe to FCM
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);

    try {
      const { getFCMToken } = await import("@/lib/firebase");
      const fcmToken = await getFCMToken(VAPID_KEY);
      
      if (!fcmToken) {
        console.error("Failed to get FCM token");
        toast({
          title: "Erreur",
          description: "Impossible d'activer les notifications. Vérifiez les permissions.",
          variant: "destructive",
        });
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
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer les notifications.",
          variant: "destructive",
        });
        return false;
      }

      setIsSubscribed(true);
      setPermission("granted");
      
      toast({
        title: "Notifications activées",
        description: "Vous recevrez des alertes même lorsque l'app est fermée.",
      });
      
      return true;
    } catch (error) {
      console.error("Error subscribing to FCM:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'activation.",
        variant: "destructive",
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
      
      toast({
        title: "Notifications désactivées",
        description: "Vous ne recevrez plus d'alertes push.",
      });
      
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
