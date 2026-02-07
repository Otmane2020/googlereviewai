import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import MobileAIDemoSection from "@/components/MobileAIDemoSection";
import { DemoSection } from "@/components/DemoSection";
import { StarlySection } from "@/components/StarlySection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { SectorsSection } from "@/components/SectorsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ComplianceSection } from "@/components/ComplianceSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { SectorDemoSection } from "@/components/SectorDemoSection";
import { Footer } from "@/components/Footer";
import { MobileStickyButton } from "@/components/MobileStickyButton";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { Loader2, Star } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!loading && user) {
        // Check subscription status
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan_name, subscription_status")
            .eq("id", user.id)
            .maybeSingle();
          
          const validStatuses = ["active", "trial", "trialing"];
          const hasValidPlan = profile?.plan_name && 
            profile.plan_name !== "free" &&
            validStatuses.includes(profile.subscription_status || "");
          
          if (hasValidPlan) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/choose-plan", { replace: true });
          }
        } catch (error) {
          console.error("[Index] Error checking subscription:", error);
        }
      }
    };

    checkAndRedirect();
  }, [user, loading, navigate]);

  // Show loader while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show landing page only for non-authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 sm:pb-0">
        <HeroSection />
        <MobileAIDemoSection />
        <DemoSection />
        <SectorDemoSection />
        <StarlySection />
        <FeaturesSection />
        <SectorsSection />
        <TestimonialsSection />
        <ComplianceSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
      <MobileStickyButton />
      <ExitIntentPopup />
      
      {/* Sticky TrustAvis Rating - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50 hidden sm:block">
        <a
          href="https://trust-avis.com/entreprise/starlinko"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-lg text-sm hover:shadow-xl transition-all"
        >
          <div className="w-4 h-4 bg-[#3B82F6] rounded flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-white fill-white" />
          </div>
          <span className="font-medium">
            <span className="text-foreground">Trust</span>
            <span className="text-[#3B82F6]">Avis</span>
          </span>
          <span className="text-muted-foreground">4.8</span>
        </a>
      </div>
    </div>
  );
};

export default Index;
