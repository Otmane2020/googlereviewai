import { useEffect, useState, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";

// ported from main.tsx
import "@/i18n/config"; // Initialize i18n (synchronous, SSR-safe)

import appCss from "../styles.css?url";
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
import { useVisitTracking } from "@/hooks/useVisitTracking";
import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import NotFound from "@/pages/NotFound";

const pushAlertHideCss =
  '#pushalert-overlay,#pa-push-notification-widget,.pushalert-subscription-widget,.pushalert-widget,.pa-widget,.pa-subscription-widget,[id*="pushalert"],[id*="pa-push"],[class*="pushalert"],[class*="pa-widget"],div[style*="pushalert"],iframe[src*="pushalert"] {display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;position:absolute!important;left:-9999px!important;top:-9999px!important;width:0!important;height:0!important;}';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      },
      { title: "Google Review AI – AI Review Replies & Local SEO" },
      {
        name: "description",
        content:
          "Google Review AI automatically replies to Google reviews, tracks local rankings and improves your visibility across Google, ChatGPT, Gemini and Perplexity.",
      },
      { name: "author", content: "Google Review AI" },
      { name: "google-site-verification", content: "07-mTOgobA9QM8vgRLYvmLuHBrEU8mVCDhG0HfNEbmw" },
      {
        name: "googlebot",
        content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      {
        name: "bingbot",
        content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      { name: "theme-color", content: "#ffffff" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Google Review AI" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
      { name: "msapplication-TileColor", content: "#4285F4" },
      { name: "msapplication-tap-highlight", content: "no" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Google Review AI – AI Review Replies & Local SEO" },
      {
        property: "og:description",
        content:
          "Automatically reply to Google reviews, improve local SEO and track your business visibility across Google and leading AI search engines.",
      },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_US" },
      { property: "og:site_name", content: "Google Review AI" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Google Review AI – AI Review Replies & Local SEO" },
      {
        name: "twitter:description",
        content:
          "Automatically reply to Google reviews, improve local SEO and track your business visibility across Google and leading AI search engines.",
      },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "apple-touch-icon", sizes: "152x152", href: "/apple-touch-icon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "apple-touch-icon", sizes: "167x167", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "shortcut icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-startup-image", href: "/splash.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [
      // Install-prompt capture — ported from main.tsx; must run before the app loads
      {
        children:
          "(function(){var w=window;if(w.__rankiPwaPromptListenerInstalled)return;w.__rankiPwaPromptListenerInstalled=true;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();w.__rankiBeforeInstallPrompt=e;window.dispatchEvent(new CustomEvent('ranki:pwa-install-ready'));});window.addEventListener('appinstalled',function(){w.__rankiBeforeInstallPrompt=null;window.dispatchEvent(new CustomEvent('ranki:pwa-installed'));});})();",
      },
      // Google Tag Manager
      {
        children:
          "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TC9B9MHW');",
      },
      // Google tag (gtag.js)
      { src: "https://www.googletagmanager.com/gtag/js?id=G-SG82SWEKN1", async: true },
      {
        children:
          "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-SG82SWEKN1');gtag('config', 'G-GMY3DMDXR8');gtag('event', 'conversion_event_page_view', {});",
      },
      // Meta Pixel
      {
        children:
          "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=function(){};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '1400016238246849');fbq('track', 'PageView');",
      },
      // LinkedIn Insight Tag
      {
        children:
          '_linkedin_partner_id = "8548802";window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l) {if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s = document.getElementsByTagName("script")[0];var b = document.createElement("script");b.type = "text/javascript";b.async = true;b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b, s);})(window.lintrk);',
      },
      // Microsoft Clarity
      {
        children:
          '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "v81mg7y2cm");',
      },
      // PushAlert - Widget disabled, using custom UI
      {
        children:
          'window.pushAlertByPass = true;window.PA_WIDGET_DISABLE = true;window.PA_DISABLED = true;(function(d, t) {var g = d.createElement(t), s = d.getElementsByTagName(t)[0];g.src = "https://cdn.pushalert.co/integrate_e9d37ad5dc4d1baed0a28cbb966d31df.js";s.parentNode.insertBefore(g, s);}(document, "script"));document.addEventListener(\'DOMContentLoaded\', function() {var hideWidget = function() {var elements = document.querySelectorAll(\'[id*="pushalert"], [class*="pushalert"], .pa-widget, #pa-push-notification-widget, .pa-subscription-widget\');elements.forEach(function(el) { el.style.display = \'none\'; el.style.visibility = \'hidden\'; el.remove(); });};hideWidget(); setInterval(hideWidget, 500);});',
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style>{pushAlertHideCss}</style>
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TC9B9MHW"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1400016238246849&ev=PageView&noscript=1"
          />
        </noscript>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://px.ads.linkedin.com/collect/?pid=8548802&fmt=gif"
          />
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppShell />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// ported from src/App.tsx (AppContent) + main.tsx (ensureServiceWorker)
function AppShell() {
  useVisitTracking();
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasRunInit, setHasRunInit] = useState(false);

  // Ensure the service worker is registered (production hosts only) — ported from main.tsx
  useEffect(() => {
    const ensureServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) return;

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
    };
    void ensureServiceWorker();
  }, []);

  useEffect(() => {
    const reloadCount = parseInt(sessionStorage.getItem("app_reload_count") || "0");
    if (reloadCount > 1) {
      console.warn("Breaking reload loop - forcing initialization");
      sessionStorage.removeItem("app_reload_count");
      setIsInitialized(true);
      setHasRunInit(true);
      return;
    }
    sessionStorage.setItem("app_reload_count", String(reloadCount + 1));
    const clearTimer = setTimeout(() => {
      sessionStorage.removeItem("app_reload_count");
    }, 3000);
    return () => clearTimeout(clearTimer);
  }, []);

  useEffect(() => {
    if (hasRunInit) return;
    const timer = setTimeout(() => {
      const standaloneNow =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      if (standaloneNow) {
        setShowSplash(true);
      } else {
        setIsInitialized(true);
      }
      setHasRunInit(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [hasRunInit]);

  const handleSplashComplete = async () => {
    setShowSplash(false);
    const hasSeenOnboarding = localStorage.getItem("googlereviewai.com_onboarding_completed");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!hasSeenOnboarding && !session) {
      setShowOnboarding(true);
    } else {
      if (session) localStorage.setItem("googlereviewai.com_onboarding_completed", "true");
      setIsInitialized(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setIsInitialized(true);
    localStorage.setItem("googlereviewai.com_onboarding_completed", "true");
  };

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : showOnboarding ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : (
        <OAuthCallback>
          <Outlet />
        </OAuthCallback>
      )}
      {isInitialized && !showSplash && !showOnboarding && (
        <>
          <InstallPrompt />
          <NotificationPrompt />
        </>
      )}
    </>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">This page didn&apos;t load</h1>
        <p className="text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a className="px-4 py-2 rounded-md border border-border text-foreground" href="/">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
