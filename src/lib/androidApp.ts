import { useEffect, useState } from "react";

// The Play Store app (android/) is a Trusted Web Activity launched with
// ?utm_source=android_app. Google Play only allows digital subscriptions via
// Play Billing, so subscriptions stay on Stripe and are only sold on the
// website; inside the app we hide every subscription purchase entry point.
// Physical goods (NFC cards, printed QR codes) may still use Stripe.
const ANDROID_PACKAGE = "com.googlereviewai.app";
const STORAGE_KEY = "android_app_session";

export const isAndroidApp = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch {
    // sessionStorage unavailable: fall through to the URL/referrer checks
  }
  const fromApp =
    new URLSearchParams(window.location.search).get("utm_source") === "android_app" ||
    document.referrer.startsWith(`android-app://${ANDROID_PACKAGE}`);
  if (fromApp) {
    // sessionStorage (not localStorage): the TWA shares Chrome's storage with
    // the regular website, but each app launch gets its own tab session.
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }
  return fromApp;
};

// Hydration-safe: false on the server and first render, then the real value.
export const useIsAndroidApp = (): boolean => {
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setInApp(isAndroidApp());
  }, []);
  return inApp;
};

export const inAppSubscriptionMessage = (isFrench: boolean) =>
  isFrench
    ? "Les abonnements ne peuvent pas être souscrits depuis l'application Android."
    : "Subscriptions can't be purchased in the Android app.";
