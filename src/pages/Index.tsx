import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ComplianceSection } from "@/components/ComplianceSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { MobileStickyButton } from "@/components/MobileStickyButton";
import { Loader2 } from "lucide-react";

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
        <FeaturesSection />
        <TestimonialsSection />
        <ComplianceSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
      <MobileStickyButton />
    </div>
  );
};

export default Index;
