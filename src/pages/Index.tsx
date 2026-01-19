import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { ComplianceSection } from "@/components/ComplianceSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { MobileStickyButton } from "@/components/MobileStickyButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 sm:pb-0">
        <HeroSection />
        <FeaturesSection />
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
