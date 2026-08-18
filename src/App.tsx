import { useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { OAuthCallback } from "@/components/OAuthCallback";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { SplashScreen } from "@/components/SplashScreen";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { supabase } from "@/integrations/supabase/client";
import { usePWA } from "@/hooks/usePWA";
import { useVisitTracking } from "@/hooks/useVisitTracking";
import i18n, { detectBrowserLanguage } from "@/i18n/config";

const APP_CACHE_VERSION = "2026-08-tanstack-start";

function ClientRuntime() {
  const { isStandalone } = usePWA();
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useVisitTracking();

  useEffect(() => {
    const language = detectBrowserLanguage();
    if (language !== i18n.language) void i18n.changeLanguage(language);

    const w = window as any;
    if (!w.__rankiPwaPromptListenerInstalled) {
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
    }

    const registerServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) return;
      const isInIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();
      const host = window.location.hostname;
      const isPreviewHost =
        host.includes("id-preview--") ||
        host.includes("lovableproject.com") ||
        host.includes("lovable.app");

      try {
        if (isPreviewHost || isInIframe) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          return;
        }

        const existing = await navigator.serviceWorker.getRegistration("/");
        if (!existing) await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.warn("[SW] registration failed", error);
      }
    };

    registerServiceWorker();

    try {
      localStorage.setItem("app_cache_version", APP_CACHE_VERSION);
    } catch {
      // Storage can be unavailable in private/restricted contexts.
    }
  }, []);

  useEffect(() => {
    if (ready) return;
    setReady(true);
    if (isStandalone) setShowSplash(true);
  }, [isStandalone, ready]);

  const handleSplashComplete = async () => {
    setShowSplash(false);
    let completed = false;
    try {
      completed = localStorage.getItem("googlereviewai.com_onboarding_completed") === "true";
    } catch {
      // Ignore unavailable storage.
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!completed && !session) setShowOnboarding(true);
    else if (session) {
      try {
        localStorage.setItem("googlereviewai.com_onboarding_completed", "true");
      } catch {
        // Ignore unavailable storage.
      }
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("googlereviewai.com_onboarding_completed", "true");
    } catch {
      // Ignore unavailable storage.
    }
  };

  return (
    <>
      {showSplash && (
        <div className="fixed inset-0 z-[10000] bg-background">
          <SplashScreen onComplete={handleSplashComplete} />
        </div>
      )}
      {showOnboarding && (
        <div className="fixed inset-0 z-[10000] bg-background">
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </div>
      )}
      {!showSplash && !showOnboarding && (
        <>
          <InstallPrompt />
          <NotificationPrompt />
        </>
      )}
    </>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OAuthCallback>{children}</OAuthCallback>
            <ClientOnly fallback={null}>
              <ClientRuntime />
            </ClientOnly>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
