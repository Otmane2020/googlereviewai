import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PushAlert handles service worker registration via its SDK
// Just ensure sw.js is registered for offline/PWA support
async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (!existing) {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("[SW] Registered PushAlert SW");
    }
  } catch (e) {
    console.warn("[SW] Failed to register service worker:", e);
  }
}

// Fire-and-forget
ensureServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
