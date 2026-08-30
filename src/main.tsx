import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config"; // Initialize i18n

const setupGlobalInstallPromptCapture = () => {
  const w = window as any;
  if (w.__rankiPwaPromptListenerInstalled) return;
  w.__rankiPwaPromptListenerInstalled = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    w.__rankiBeforeInstallPrompt = event;
    window.dispatchEvent(new CustomEvent("ranki:pwa-install-ready"));
  });

  window.addEventListener("appinstalled", () => {
    w.__rankiBeforeInstallPrompt = null;
    window.dispatchEvent(new CustomEvent("ranki:pwa-installed"));
  });
};

setupGlobalInstallPromptCapture();

// One-time hard refresh for legacy/mobile devices that may be stuck on old cached bundles.
// Safe-guarded to avoid reload loops.
const APP_CACHE_VERSION = "2026-02-03-v3";
async function maybeHardResetCachesOnce() {
  try {
    const last = localStorage.getItem("app_cache_version");
    if (last === APP_CACHE_VERSION) return;

    // Prevent loops if something goes wrong.
    const already = sessionStorage.getItem("app_cache_reset_in_progress");
    if (already === APP_CACHE_VERSION) {
      localStorage.setItem("app_cache_version", APP_CACHE_VERSION);
      return;
    }
    sessionStorage.setItem("app_cache_reset_in_progress", APP_CACHE_VERSION);

    // Clear Cache Storage if available
    const w = window as any;
    if (w.caches && typeof w.caches.keys === "function") {
      const keys = await w.caches.keys();
      await Promise.all(keys.map((k: string) => w.caches.delete(k)));
    }

    // Unregister all service workers (old devices can keep stale SWs around)
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    localStorage.setItem("app_cache_version", APP_CACHE_VERSION);
    // Reload once with a cache-busting query
    const url = new URL(window.location.href);
    url.searchParams.set("v", APP_CACHE_VERSION);
    window.location.replace(url.toString());
  } catch {
    // Never block app startup
  }
}

// PushAlert handles service worker registration via its SDK
// Just ensure sw.js is registered for offline/PWA support
async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // Guard: never register SW inside Lovable preview iframe or on preview hosts
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app");

  if (isPreviewHost || isInIframe) {
    // Unregister any existing service workers in preview/iframe contexts
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      console.log("[SW] Unregistered in preview/iframe context");
    } catch {
      // ignore
    }
    return;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (!existing) {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("[SW] Registered GoogleReviewAI SW");
    }
  } catch (e) {
    console.warn("[SW] Failed to register service worker:", e);
  }
}

// Fire-and-forget - cache reset disabled to prevent flash/reload loops
// maybeHardResetCachesOnce();
ensureServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
