import { useState, useEffect, useCallback } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (!("Notification" in window)) {
      setIsSupported(false);
      setPermission("unsupported");
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission as PermissionState);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission !== "granted") return null;

      try {
        const notification = new Notification(title, {
          icon: "/icon-512x512.png",
          badge: "/icon-512x512.png",
          ...options,
        });
        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
    [permission]
  );

  return {
    permission,
    isSupported,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
    requestPermission,
    sendNotification,
  };
};
