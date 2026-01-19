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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SelectPlan from "./pages/SelectPlan";
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
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isStandalone } = usePWA();
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if this is first launch in standalone mode
    if (isStandalone) {
      const hasSeenOnboarding = localStorage.getItem("starlinko_onboarding_completed");
      if (!hasSeenOnboarding) {
        setShowSplash(true);
      }
    }
  }, [isStandalone]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("starlinko_onboarding_completed", "true");
  };

  return (
    <BrowserRouter>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Global prompts */}
          <InstallPrompt />
          <NotificationPrompt />
        </OAuthCallback>
      )}
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
