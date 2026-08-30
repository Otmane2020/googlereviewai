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
import { ReviewAIShowcaseSection } from "@/components/ReviewAIShowcaseSection";
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

  const title = t("landing.title");
  const description = t("landing.description");
  const locale = i18n.language?.startsWith("fr") ? "fr_FR" : "en_US";

  const homepageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://googlereviewai.com/#website",
        "url": "https://googlereviewai.com/",
        "name": "Google Review AI",
        "description": description,
        "inLanguage": i18n.language?.startsWith("fr") ? "fr" : "en"
      },
      {
        "@type": "Organization",
        "@id": "https://googlereviewai.com/#organization",
        "name": "Google Review AI",
        "url": "https://googlereviewai.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://googlereviewai.com/icon-512x512.png"
        },
        "email": "support@googlereviewai.com"
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://googlereviewai.com/#software",
        "name": "Google Review AI",
        "url": "https://googlereviewai.com/",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": description,
        "publisher": { "@id": "https://googlereviewai.com/#organization" },
        "featureList": [
          "AI-generated responses to Google reviews",
          "Google Business Profile review management",
          "Local SEO visibility tracking",
          "Local rank tracking",
          "AI search visibility tracking"
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <html lang={i18n.language} />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://googlereviewai.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://googlereviewai.com/" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://googlereviewai.com/og-image.png" />
        <meta property="og:locale" content={locale} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://googlereviewai.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(homepageSchema)}</script>
      </Helmet>

      <Header />
      <main>
        <RankiHero />
        <GeoRankSection />
        <HowItWorksSection />
        <ReviewAIShowcaseSection />
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
