import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

interface UseFirebasePushReturn {
  permission: PushPermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  isTesting: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  testNotification: () => Promise<boolean>;
}

// VAPID key for FCM - from Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY = "BGQFbt1RdpEVn504DOoxkQ32sRJM6AL15bsBn7KSFipkO_qvDeSOXiNNv8-zIHCunTZj4RBM7JQmE_-CiEel3HA";

export const useFirebasePush = (): UseFirebasePushReturn => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Check support and subscription status
  useEffect(() => {
    const checkSupport = async () => {
      // Check browser support for Firebase Push
      const hasNotification = "Notification" in window;
      const hasServiceWorker = "serviceWorker" in navigator;
      const hasPushManager = "PushManager" in window;
      const supported = hasNotification && hasServiceWorker && hasPushManager;

      console.log("[useFirebasePush] Support check:", { 
        supported, 
        hasNotification,
        hasServiceWorker,
        hasPushManager
      });
      
      setIsSupported(supported);

      if (supported) {
        const currentPermission = Notification.permission as PushPermissionState;
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
          console.log("[useFirebasePush] Has subscription in DB:", hasSubscription);
          setIsSubscribed(hasSubscription);
        }
      } else {
        setPermission("unsupported");
      }
    };

    checkSupport();
  }, [user]);

  // Setup foreground message handler for in-app toast notifications
  // Important: do NOT depend on `isSubscribed` here.
  // The client-side DB check can fail due to policies/network, while FCM can still deliver messages.
  // If the browser permission is granted and Firebase messaging is supported, we should listen.
  useEffect(() => {
    if (!isSupported || !user || permission !== "granted") return;

    let unsubscribe: (() => void) | null = null;

    const setupForegroundHandler = async () => {
      try {
        const { getMessaging, onMessage } = await import("firebase/messaging");
        const { initializeApp, getApps } = await import("firebase/app");

        const firebaseConfig = {
          apiKey: "AIzaSyB8_ReuGYylRKMKu9L9leSRFB0nKCqRT64",
          authDomain: "starlinkoapp.firebaseapp.com",
          projectId: "starlinkoapp",
          storageBucket: "starlinkoapp.firebasestorage.app",
          messagingSenderId: "361474350795",
          appId: "1:361474350795:web:c9f170e0dc04201149454e",
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const messaging = getMessaging(app);

        console.log("[useFirebasePush] Setting up foreground message handler");

        unsubscribe = onMessage(messaging, (payload) => {
          console.log("[useFirebasePush] 📨 Foreground message received:", payload);
          
          const title = payload.notification?.title || "Nouvelle notification";
          const body = payload.notification?.body || "";
          
          // Show in-app toast
          toast(title, {
            description: body,
            duration: 8000,
            action: payload.data?.url ? {
              label: "Voir",
              onClick: () => {
                window.location.href = payload.data!.url;
              },
            } : undefined,
          });
        });

        console.log("[useFirebasePush] ✅ Foreground handler active");
      } catch (error) {
        console.error("[useFirebasePush] Failed to setup foreground handler:", error);
      }
    };

    setupForegroundHandler();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported, user, permission]);

  // Subscribe to FCM - FIREBASE ONLY, no browser notification API
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log("[useFirebasePush] ========== SUBSCRIBE START ==========");
    console.log("[useFirebasePush] State:", { isSupported, hasUser: !!user });
    
    if (!isSupported) {
      console.error("[useFirebasePush] ❌ Push not supported");
      return false;
    }
    
    if (!user) {
      console.error("[useFirebasePush] ❌ No user logged in");
      return false;
    }

    setIsLoading(true);

    try {
      // Step 1: Register Firebase service worker FIRST
      console.log("[useFirebasePush] Step 1: Registering Firebase service worker...");
      let swRegistration: ServiceWorkerRegistration;
      
      try {
        // Check for existing registration
        const existingReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
        if (existingReg) {
          console.log("[useFirebasePush] ✅ SW already registered:", existingReg.scope);
          swRegistration = existingReg;
        } else {
          console.log("[useFirebasePush] Registering new SW...");
          swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("[useFirebasePush] ✅ SW registered:", swRegistration.scope);
        }
        
        // Wait for SW to be ready
        await navigator.serviceWorker.ready;
        console.log("[useFirebasePush] ✅ Service worker is ready");
      } catch (swError) {
        console.error("[useFirebasePush] ❌ Service worker registration failed:", swError);
        return false;
      }

      // Step 2: Request notification permission via Firebase (NOT browser API directly)
      console.log("[useFirebasePush] Step 2: Requesting permission...");
      console.log("[useFirebasePush] Current Notification.permission:", Notification.permission);
      
      // This is the ONLY place permission should be requested
      const permissionResult = await Notification.requestPermission();
      console.log("[useFirebasePush] Permission result:", permissionResult);
      setPermission(permissionResult as PushPermissionState);
      
      if (permissionResult !== "granted") {
        console.error("[useFirebasePush] ❌ Permission not granted:", permissionResult);
        return false;
      }
      console.log("[useFirebasePush] ✅ Permission granted");

      // Step 3: Get FCM token using Firebase SDK
      console.log("[useFirebasePush] Step 3: Getting FCM token...");
      
      const { getMessaging, getToken } = await import("firebase/messaging");
      const { initializeApp, getApps } = await import("firebase/app");
      
      // Firebase config
      const firebaseConfig = {
        apiKey: "AIzaSyB8_ReuGYylRKMKu9L9leSRFB0nKCqRT64",
        authDomain: "starlinkoapp.firebaseapp.com",
        projectId: "starlinkoapp",
        storageBucket: "starlinkoapp.firebasestorage.app",
        messagingSenderId: "361474350795",
        appId: "1:361474350795:web:c9f170e0dc04201149454e",
        measurementId: "G-TG4JK5XTG3"
      };
      
      // Initialize Firebase app if not already done
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const messaging = getMessaging(app);
      
      console.log("[useFirebasePush] Firebase messaging initialized");
      console.log("[useFirebasePush] Using VAPID key:", VAPID_KEY.substring(0, 20) + "...");
      
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });
      
      if (!fcmToken) {
        console.error("[useFirebasePush] ❌ Failed to get FCM token");
        console.error("[useFirebasePush] This usually means:");
        console.error("  1. VAPID key doesn't match Firebase console");
        console.error("  2. Service worker failed to register properly");
        console.error("  3. Firebase is blocked by browser/firewall");
        return false;
      }

      console.log("[useFirebasePush] ✅ FCM Token obtained!");
      console.log("[useFirebasePush] Token length:", fcmToken.length);
      console.log("[useFirebasePush] Token preview:", fcmToken.substring(0, 50) + "...");

      // Step 4: Delete old subscriptions for this user
      console.log("[useFirebasePush] Step 4: Cleaning old subscriptions...");
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);
      
      if (deleteError) {
        console.warn("[useFirebasePush] ⚠️ Delete warning (non-critical):", deleteError);
      }

      // Step 5: Store new FCM token in database
      console.log("[useFirebasePush] Step 5: Saving FCM token to database...");
      const { error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          endpoint: fcmToken,  // FCM token goes here
          p256dh: "fcm",       // Marker that this is FCM, not web push
          auth: "fcm",
        });

      if (error) {
        console.error("[useFirebasePush] ❌ Database error:", error);
        console.error("[useFirebasePush] Error details:", JSON.stringify(error, null, 2));
        return false;
      }

      console.log("[useFirebasePush] ✅ FCM token saved to database!");
      console.log("[useFirebasePush] ========== SUBSCRIBE SUCCESS ==========");
      setIsSubscribed(true);
      
      // NOTE: We do NOT show a browser notification here!
      // Notifications are shown by the SERVICE WORKER when FCM sends a message
      
      return true;
    } catch (error) {
      console.error("[useFirebasePush] ❌ Unexpected error:", error);
      if (error instanceof Error) {
        console.error("[useFirebasePush] Error name:", error.name);
        console.error("[useFirebasePush] Error message:", error.message);
        console.error("[useFirebasePush] Error stack:", error.stack);
      }
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
      console.log("[useFirebasePush] Unsubscribing...");
      
      // Remove from database
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("[useFirebasePush] Error removing subscription:", error);
        return false;
      }

      console.log("[useFirebasePush] ✅ Unsubscribed successfully");
      setIsSubscribed(false);
      
      return true;
    } catch (error) {
      console.error("[useFirebasePush] Error unsubscribing:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Test push notification
  const testNotification = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.error("[useFirebasePush] Cannot test - no user");
      return false;
    }

    setIsTesting(true);

    try {
      console.log("[useFirebasePush] Sending test notification...");
      
      const { data, error } = await supabase.functions.invoke("test-push-notification", {});

      if (error) {
        console.error("[useFirebasePush] Test error:", error);
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
      console.error("[useFirebasePush] Test exception:", error);
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
