import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const faqs = [
    {
      question: "Qu'est-ce que le GEO (Generative Engine Optimization) ?",
      answer:
        "Le GEO est la discipline qui consiste à faire apparaître — et classer en premier — votre établissement dans les réponses des IA génératives comme ChatGPT, Gemini, Perplexity et Claude. C'est le successeur du SEO local à l'ère de l'IA.",
    },
    {
      question: "Comment Starlinko connaît-il mon classement sur ChatGPT ou Gemini ?",
      answer:
        "Starlinko envoie de vraies requêtes sur chaque IA pour les recherches locales qui comptent pour vous (ex : « meilleur dentiste à Lyon »), analyse les réponses et suit si votre établissement est mentionné, à quelle position et face à quels concurrents.",
    },
    {
      question: "Starlinko va-t-il vraiment améliorer mon positionnement IA ?",
      answer:
        "Oui. Starlinko publie automatiquement des Q&R et des posts SEO optimisés pour l'IA sur votre fiche Google Business — exactement les sources qu'indexent les LLM — et répond aux avis dans le ton de votre marque. En quelques semaines, votre part de voix dans les réponses IA augmente fortement, ce qui booste votre visibilité et vos ventes.",
    },
    {
      question: "Ai-je besoin d'une fiche Google Business ?",
      answer:
        "Oui. Starlinko se connecte à votre fiche Google Business pour récupérer les avis, publier du contenu et aligner vos signaux entre Google Search, Google Maps et les moteurs IA.",
    },
    {
      question: "Existe-t-il une offre gratuite ?",
      answer:
        "Oui. L'offre Starter est gratuite à vie : rapport hebdomadaire de classement GEO, réponses IA aux avis et 25 crédits par mois. Passez à l'offre Quotidien (9,99 €/mois) pour le suivi quotidien et la publication automatique chaque jour.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Starlinko – Boostez vos ventes et votre visibilité sur ChatGPT, Gemini & Perplexity</title>
        <meta
          name="description"
          content="Starlinko booste votre visibilité, améliore votre positionnement sur Google et les IA (ChatGPT, Gemini, Perplexity) et augmente vos ventes grâce à une stratégie de référencement naturel automatisée."
        />
        <link rel="canonical" href="https://starlinko.app/" />
      </Helmet>

      <Header />
      <main>
        <RankiHero />
        <GeoRankSection />
        <HowItWorksSection />
        <ReviewsAISection />
        <RankiPricingSection />
        <FAQSection
          faqs={faqs}
          title="Tout savoir sur Starlinko"
          subtitle="La plateforme GEO conçue pour les commerces et professionnels locaux."
          badgeText="FAQ"
        />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
