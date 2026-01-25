import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Important: Keep a SINGLE service worker at scope '/'.
// Having both a PWA SW and a Firebase Messaging SW causes push to be unreliable
// because only one SW can control a given scope.
async function ensureFirebaseServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();

    // Unregister anything that isn't the Firebase messaging SW.
    await Promise.all(
      regs.map(async (reg) => {
        const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
        const isFirebaseSw = scriptUrl.includes("/firebase-messaging-sw.js");
        if (!isFirebaseSw) {
          await reg.unregister();
        }
      })
    );

    // Ensure Firebase SW is registered.
    const existing = await navigator.serviceWorker.getRegistration("/");
    const existingUrl = existing?.active?.scriptURL || "";
    if (!existing || !existingUrl.includes("/firebase-messaging-sw.js")) {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    }

    // Make sure it's controlling the page.
    await navigator.serviceWorker.ready;
  } catch (e) {
    console.warn("[SW] Failed to ensure Firebase service worker:", e);
  }
}

// Fire-and-forget (no need to block initial render)
ensureFirebaseServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
