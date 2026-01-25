import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Important: Keep a SINGLE service worker at scope '/'.
// Native Web Push SW for notifications.
async function ensurePushServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();

    // Unregister old Firebase SW if present
    await Promise.all(
      regs.map(async (reg) => {
        const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
        if (scriptUrl.includes("/firebase-messaging-sw.js")) {
          await reg.unregister();
          console.log("[SW] Unregistered old Firebase SW");
        }
      })
    );

    // Ensure native push SW is registered
    const existing = await navigator.serviceWorker.getRegistration("/");
    const existingUrl = existing?.active?.scriptURL || "";
    if (!existing || !existingUrl.includes("/sw.js")) {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("[SW] Registered native push SW");
    }

    // Don't await ready - let SW activate in background
  } catch (e) {
    console.warn("[SW] Failed to ensure push service worker:", e);
  }
}

// Fire-and-forget (no need to block initial render)
ensurePushServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
