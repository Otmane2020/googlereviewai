import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankiHero } from "@/components/ranki/RankiHero";
import { GeoRankSection } from "@/components/ranki/GeoRankSection";
import { HowItWorksSection } from "@/components/ranki/HowItWorksSection";
import { ReviewsAISection } from "@/components/ranki/ReviewsAISection";
import { DashboardPreviewSection } from "@/components/ranki/DashboardPreviewSection";
import { RankiPricingSection } from "@/components/ranki/RankiPricingSection";
import { FAQSection } from "@/components/FAQSection";
import { CTASection } from "@/components/CTASection";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const faqs = (t("landing.faq", { returnObjects: true }) as { q: string; a: string }[]).map((f) => ({
    question: f.q,
    answer: f.a,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <html lang={i18n.language} />
        <title>{t("landing.title")}</title>
        <meta name="description" content={t("landing.description")} />
        <link rel="canonical" href="https://starlinko.app/" />
      </Helmet>

      <Header />
      <main>
        <RankiHero />
        <GeoRankSection />
        <HowItWorksSection />
        <ReviewsAISection />
        <DashboardPreviewSection />
        <RankiPricingSection />
        <FAQSection
          faqs={faqs}
          title={t("landing.faqTitle")}
          subtitle={t("landing.faqSubtitle")}
          badgeText={t("landing.faqBadge")}
        />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
