// Firebase configuration for Starlinko
// Uses dynamic imports to avoid build issues

// Firebase configuration (public keys - safe to expose)
export const firebaseConfig = {
  apiKey: "AIzaSyB8_ReuGYylRKMKu9L9leSRFB0nKCqRT64",
  authDomain: "starlinkoapp.firebaseapp.com",
  projectId: "starlinkoapp",
  storageBucket: "starlinkoapp.firebasestorage.app",
  messagingSenderId: "361474350795",
  appId: "1:361474350795:web:c9f170e0dc04201149454e",
  measurementId: "G-TG4JK5XTG3"
};

// Lazy-loaded Firebase instances
let firebaseApp: any = null;
let messagingInstance: any = null;

// Initialize Firebase lazily
export const getFirebaseApp = async () => {
  if (firebaseApp) return firebaseApp;
  
  const { initializeApp } = await import("firebase/app");
  firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
};

// Initialize Messaging lazily
export const getMessagingInstance = async () => {
  if (typeof window === "undefined") return null;
  
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push messaging is not supported");
    return null;
  }

  if (messagingInstance) return messagingInstance;

  try {
    const app = await getFirebaseApp();
    const { getMessaging } = await import("firebase/messaging");
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error);
    return null;
  }
};

// Get FCM token for push notifications
export const getFCMToken = async (vapidKey: string): Promise<string | null> => {
  console.log("[firebase.ts] getFCMToken called");
  
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.error("[firebase.ts] Messaging instance is null");
    return null;
  }
  console.log("[firebase.ts] Messaging instance obtained");

  try {
    // Request notification permission
    console.log("[firebase.ts] Checking notification permission...");
    const permission = await Notification.requestPermission();
    console.log("[firebase.ts] Permission result:", permission);
    
    if (permission !== "granted") {
      console.log("[firebase.ts] Notification permission denied");
      return null;
    }

    // Get or register service worker
    console.log("[firebase.ts] Getting/registering service worker...");
    let registration: ServiceWorkerRegistration;
    
    try {
      // Try to get existing registration first
      const existingReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
      if (existingReg) {
        console.log("[firebase.ts] Using existing SW registration:", existingReg.scope);
        registration = existingReg;
      } else {
        console.log("[firebase.ts] Registering new SW...");
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("[firebase.ts] SW registered:", registration.scope);
      }
      
      // Wait for SW to be ready
      await navigator.serviceWorker.ready;
      console.log("[firebase.ts] Service worker ready");
    } catch (swError) {
      console.error("[firebase.ts] Service worker error:", swError);
      throw swError;
    }
    
    // Get FCM token
    console.log("[firebase.ts] Getting FCM token with VAPID key...");
    const { getToken } = await import("firebase/messaging");
    
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("[firebase.ts] ✅ FCM Token obtained successfully!");
      console.log("[firebase.ts] Token length:", token.length);
    } else {
      console.error("[firebase.ts] ❌ getToken returned null/empty");
    }
    
    return token;
  } catch (error) {
    console.error("[firebase.ts] Error getting FCM token:", error);
    if (error instanceof Error) {
      console.error("[firebase.ts] Error name:", error.name);
      console.error("[firebase.ts] Error message:", error.message);
      if (error.message.includes("messaging/permission-blocked")) {
        console.error("[firebase.ts] Notifications are blocked in browser settings");
      }
      if (error.message.includes("messaging/token-subscribe-failed")) {
        console.error("[firebase.ts] FCM subscription failed - check VAPID key");
      }
    }
    return null;
  }
};

// Listen for foreground messages
export const setupForegroundMessageListener = async (callback: (payload: any) => void) => {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
};
