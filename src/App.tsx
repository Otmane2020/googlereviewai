import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OAuthCallback } from "@/components/OAuthCallback";
import { supabase } from "@/integrations/supabase/client";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { SplashScreen } from "@/components/SplashScreen";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { usePWA } from "@/hooks/usePWA";
import { useVisitTracking } from "@/hooks/useVisitTracking";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
// SelectPlan removed - using ChoosePlan instead
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
import Checklist from "./pages/Checklist";
import LocalAEO from "./pages/LocalAEO";
import GmbPost from "./pages/GmbPost";
import GmbAutopostingGuide from "./pages/GmbAutopostingGuide";
import AvisAIRestaurant from "./pages/AvisAIRestaurant";
import AvisAIHotel from "./pages/AvisAIHotel";
import AvisAIGuide from "./pages/AvisAIGuide";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import NotFound from "./pages/NotFound";
import LandingPremium from "./pages/LandingPremium";
import LandingFacebook from "./pages/LandingFacebook";
import Calendar from "./pages/Calendar";
import Onboarding from "./pages/Onboarding";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Boutique from "./pages/Boutique";
import BoutiqueNFC from "./pages/BoutiqueNFC";
import BoutiqueQRImprime from "./pages/BoutiqueQRImprime";
import Commandes from "./pages/Commandes";
import AdminOrders from "./pages/AdminOrders";
import LandingQRGratuit from "./pages/LandingQRGratuit";
import Shop from "./pages/Shop";
import ShopProduct from "./pages/ShopProduct";
import ShopCheckout from "./pages/ShopCheckout";
import Restaurants from "./pages/Restaurants";
import Hotels from "./pages/Hotels";
import { DashboardLayout } from "./components/DashboardLayout";

// Wraps a page with the persistent dashboard sidebar (desktop) + bottom nav (mobile)
const Shell = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

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

  // Anti-loop protection: detect excessive reloads and force initialization
  useEffect(() => {
    const reloadCount = parseInt(sessionStorage.getItem("app_reload_count") || "0");
    
    // After 2 reloads in 3 seconds, force initialization and break the loop
    if (reloadCount > 1) {
      console.warn("Breaking reload loop - forcing initialization");
      sessionStorage.removeItem("app_reload_count");
      setIsInitialized(true);
      setHasRunInit(true);
      return;
    }
    
    sessionStorage.setItem("app_reload_count", String(reloadCount + 1));
    
    // Clear counter after 3 seconds of stability
    const clearTimer = setTimeout(() => {
      sessionStorage.removeItem("app_reload_count");
    }, 3000);
    
    return () => clearTimeout(clearTimer);
  }, []);

  useEffect(() => {
    // Only run initialization logic ONCE
    if (hasRunInit) return;
    
    // Wait for isStandalone to stabilize (usePWA starts with false, then updates)
    const timer = setTimeout(() => {
      const standaloneNow = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      
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
    const hasSeenOnboarding = localStorage.getItem("ranki.ai_onboarding_completed");
    // Skip onboarding for already authenticated users
    const { data: { session } } = await supabase.auth.getSession();
    if (!hasSeenOnboarding && !session) {
      setShowOnboarding(true);
    } else {
      if (session) localStorage.setItem("ranki.ai_onboarding_completed", "true");
      setIsInitialized(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setIsInitialized(true);
    localStorage.setItem("ranki.ai_onboarding_completed", "true");
  };

  // Show minimal loader while we determine standalone status (instead of null for old devices)
  if (!hasRunInit) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
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
              <Route path="/select-plan" element={<ChoosePlan />} />
              <Route path="/choose-plan" element={<ChoosePlan />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
              <Route path="/calendar" element={<Shell><Calendar /></Shell>} />
              <Route path="/reviews" element={<Shell><Reviews /></Shell>} />
              <Route path="/ai-settings" element={<Shell><AISettings /></Shell>} />
              <Route path="/settings" element={<Shell><Settings /></Shell>} />
              <Route path="/businesses" element={<Shell><Businesses /></Shell>} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/install" element={<Install />} />
              <Route path="/seo-autopost" element={<Shell><SEOAutoPost /></Shell>} />
              <Route path="/aeo-rank" element={<Shell><AEORank /></Shell>} />
              <Route path="/maps-rank" element={<Shell><MapsRank /></Shell>} />
              <Route path="/notifications" element={<Shell><Notifications /></Shell>} />
              <Route path="/mobile-ads" element={<MobileAds />} />
              <Route path="/PW" element={<PasswordAuth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/local-aeo" element={<LocalAEO />} />
              <Route path="/gmb-post" element={<Shell><GmbPost /></Shell>} />
              <Route path="/gmb-autoposting" element={<GmbAutopostingGuide />} />
              <Route path="/avis-ai-restaurant" element={<AvisAIRestaurant />} />
              <Route path="/avis-ai-hotel" element={<AvisAIHotel />} />
              <Route path="/avis-ai-guide" element={<AvisAIGuide />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/landing" element={<LandingPremium />} />
              <Route path="/lp/facebook" element={<LandingFacebook />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/boutique" element={<Shell><Boutique /></Shell>} />
              <Route path="/boutique/nfc" element={<Shell><BoutiqueNFC /></Shell>} />
              <Route path="/boutique/qr-imprime" element={<Shell><BoutiqueQRImprime /></Shell>} />
              <Route path="/commandes" element={<Shell><Commandes /></Shell>} />
              <Route path="/qr-gratuit" element={<LandingQRGratuit />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/checkout" element={<ShopCheckout />} />
              <Route path="/shop/:slug" element={<ShopProduct />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OAuthCallback>
        )}
        {/* Global prompts - outside OAuthCallback to avoid ref issues */}
        {isInitialized && !showSplash && !showOnboarding && (
          <>
            <InstallPrompt />
            <NotificationPrompt />
          </>
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
