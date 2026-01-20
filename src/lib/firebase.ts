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
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Get registration for the firebase messaging service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    
    // Get FCM token
    const { getToken } = await import("firebase/messaging");
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    console.log("FCM Token obtained:", token ? "Success" : "Failed");
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
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
