import { useState, useEffect } from "react";

interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isNativeApp: boolean;
  canUsePushAlert: boolean;
  isDesktop: boolean;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isAndroid: false,
    isIOS: false,
    isMobile: false,
    isNativeApp: false,
    canUsePushAlert: true,
    isDesktop: true,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent || "";
    
    // Detect Android
    const isAndroid = /Android/i.test(userAgent);
    
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    // Detect mobile (Android or iOS)
    const isMobile = isAndroid || isIOS || /mobile/i.test(userAgent);
    
    // Detect if running inside Capacitor WebView (native app)
    const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.() ||
      // Fallback detection for Capacitor
      !!(window as any).Capacitor ||
      // Check for specific Android WebView markers
      (isAndroid && /wv|WebView/i.test(userAgent));
    
    // PushAlert (Web Push) only works in browsers, not in native WebViews
    const canUsePushAlert = !isNativeApp && "Notification" in window;
    
    // Desktop is everything that's not mobile
    const isDesktop = !isMobile;

    setDeviceInfo({
      isAndroid,
      isIOS,
      isMobile,
      isNativeApp,
      canUsePushAlert,
      isDesktop,
    });
  }, []);

  return deviceInfo;
};

// Static detection for SSR-safe usage or outside of React components
export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === "undefined") {
    return {
      isAndroid: false,
      isIOS: false,
      isMobile: false,
      isNativeApp: false,
      canUsePushAlert: true,
      isDesktop: true,
    };
  }

  const userAgent = navigator.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isMobile = isAndroid || isIOS || /mobile/i.test(userAgent);
  const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.() ||
    !!(window as any).Capacitor ||
    (isAndroid && /wv|WebView/i.test(userAgent));
  const canUsePushAlert = !isNativeApp && "Notification" in window;
  const isDesktop = !isMobile;

  return {
    isAndroid,
    isIOS,
    isMobile,
    isNativeApp,
    canUsePushAlert,
    isDesktop,
  };
};

// Google Play Store URL for Ranki.ai
export const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.world.fi.starlinko";
