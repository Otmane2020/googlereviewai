import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OAuthCallback } from "@/components/OAuthCallback";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { SplashScreen } from "@/components/SplashScreen";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { usePWA } from "@/hooks/usePWA";
import { useVisitTracking } from "@/hooks/useVisitTracking";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SelectPlan from "./pages/SelectPlan";
import ChoosePlan from "./pages/ChoosePlan";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Reviews from "./pages/Reviews";
import AISettings from "./pages/AISettings";
import Settings from "./pages/Settings";
import Businesses from "./pages/Businesses";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Install from "./pages/Install";
import SEOAutoPost from "./pages/SEOAutoPost";
import AEORank from "./pages/AEORank";
import MapsRank from "./pages/MapsRank";
import Notifications from "./pages/Notifications";
import ResetPassword from "./pages/ResetPassword";
import MobileAds from "./pages/MobileAds";
import PasswordAuth from "./pages/PasswordAuth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Tracking wrapper - must be inside BrowserRouter
const TrackingWrapper = ({ children }: { children: React.ReactNode }) => {
  useVisitTracking();
  return <>{children}</>;
};

const AppContent = () => {
  const { isStandalone } = usePWA();
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasRunInit, setHasRunInit] = useState(false);

  useEffect(() => {
    // Only run initialization logic ONCE
    if (hasRunInit) return;
    
    // Wait for isStandalone to stabilize (usePWA starts with false, then updates)
    // We use a small delay to let the media query check complete
    const timer = setTimeout(() => {
      const standaloneNow = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      
      if (standaloneNow) {
        const hasSeenOnboarding = localStorage.getItem("starlinko_onboarding_completed");
        // Show splash on every app open in PWA mode
        setShowSplash(true);
        // Will show onboarding after splash if first time
      } else {
        setIsInitialized(true);
      }
      setHasRunInit(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [hasRunInit]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    const hasSeenOnboarding = localStorage.getItem("starlinko_onboarding_completed");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    } else {
      setIsInitialized(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setIsInitialized(true);
    localStorage.setItem("starlinko_onboarding_completed", "true");
  };

  // Show nothing while we determine standalone status
  if (!hasRunInit) {
    return null;
  }

  return (
    <BrowserRouter>
      <TrackingWrapper>
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : showOnboarding ? (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        ) : (
          <OAuthCallback>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/select-plan" element={<SelectPlan />} />
              <Route path="/choose-plan" element={<ChoosePlan />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/ai-settings" element={<AISettings />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/businesses" element={<Businesses />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/install" element={<Install />} />
              <Route path="/seo-autopost" element={<SEOAutoPost />} />
              <Route path="/aeo-rank" element={<AEORank />} />
              <Route path="/maps-rank" element={<MapsRank />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/mobile-ads" element={<MobileAds />} />
              <Route path="/PW" element={<PasswordAuth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Global prompts */}
            <InstallPrompt />
            <NotificationPrompt />
          </OAuthCallback>
        )}
      </TrackingWrapper>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
