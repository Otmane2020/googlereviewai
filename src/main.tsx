import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update when new content is available
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App ready for offline use");
  },
  onRegisteredSW(swUrl, registration) {
    // Check for updates every 60 seconds
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);
