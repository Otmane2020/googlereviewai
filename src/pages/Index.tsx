import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import MobileAIDemoSection from "@/components/MobileAIDemoSection";
import { DemoSection } from "@/components/DemoSection";
import { StarlySection } from "@/components/StarlySection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { SectorsSection } from "@/components/SectorsSection";
import { SectorShowcaseSection } from "@/components/SectorShowcaseSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ComplianceSection } from "@/components/ComplianceSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { SectorDemoSection } from "@/components/SectorDemoSection";
import { Footer } from "@/components/Footer";
import { MobileStickyButton } from "@/components/MobileStickyButton";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { FAQSection } from "@/components/FAQSection";
import { Loader2, Star } from "lucide-react";
import { Helmet } from "react-helmet";
import {
  OrganizationSchema,
  WebSiteSchema,
  SoftwareApplicationSchema,
  FAQPageSchema,
} from "@/components/StructuredData";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
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

  const homepageFaqs = [
    {
      question: "Comment Starlinko répond-il automatiquement aux avis Google ?",
      answer: "Starlinko utilise l'intelligence artificielle pour analyser chaque avis Google reçu et générer une réponse personnalisée en fonction du contenu, du ton et de la note de l'avis. Les réponses sont publiées automatiquement sur votre fiche Google Business Profile en moins de 2 heures."
    },
    {
      question: "Qu'est-ce que l'AEO (Answer Engine Optimization) ?",
      answer: "L'AEO est l'optimisation de votre présence en ligne pour les moteurs de réponse IA comme ChatGPT, Gemini et Perplexity. Starlinko génère automatiquement des questions-réponses structurées publiées sur votre fiche Google pour que les IA recommandent votre entreprise."
    },
    {
      question: "Comment Starlinko améliore-t-il mon SEO local ?",
      answer: "Starlinko publie automatiquement des contenus optimisés sur votre fiche Google Business Profile : posts SEO avec mots-clés locaux, Q&A AEO et articles géolocalisés. Ces publications régulières signalent à Google que votre fiche est active, améliorant votre classement local."
    },
    {
      question: "Combien coûte Starlinko ?",
      answer: "Starlinko est 100% gratuit. Gérez vos avis Google avec l'IA, recevez 1 post SEO par semaine et 10 crédits offerts. Pour publier tous les jours (SEO + AEO ChatGPT), un upgrade à 9,99€/mois est disponible."
    },
    {
      question: "Starlinko fonctionne-t-il pour tous les types d'entreprises ?",
      answer: "Oui, Starlinko est conçu pour toutes les entreprises locales : restaurants, hôtels, salons de coiffure, garages, professionnels de santé, commerces de proximité, artisans et centres de formation. L'IA adapte le ton et le contenu à chaque secteur d'activité."
    },
    {
      question: "Comment apparaître dans les réponses de ChatGPT ?",
      answer: "Pour apparaître dans les réponses de ChatGPT, il faut publier du contenu structuré en format question-réponse sur votre fiche Google. Starlinko automatise ce processus via son module AEO qui génère et publie quotidiennement des Q&A optimisés pour les moteurs de réponse IA."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Starlinko – IA pour Avis Google, SEO Local & AEO ChatGPT</title>
        <meta
          name="description"
          content="Automatisez vos réponses aux avis Google avec l'IA. Boostez votre SEO local et apparaissez dans ChatGPT grâce à l'AEO. Essai gratuit 7 jours."
        />
        <link rel="canonical" href="https://starlinko.app/" />
        <meta property="og:title" content="Starlinko – IA pour Avis Google, SEO Local & AEO ChatGPT" />
        <meta property="og:description" content="Automatisez vos réponses aux avis Google, boostez votre SEO local et apparaissez dans ChatGPT. +500 entreprises équipées." />
        <meta property="og:url" content="https://starlinko.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://starlinko.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Starlinko – IA pour Avis Google & SEO Local" />
        <meta name="twitter:description" content="Réponses automatiques IA aux avis Google. SEO local & AEO ChatGPT. Essai gratuit." />
      </Helmet>

      <OrganizationSchema />
      <WebSiteSchema />
      <SoftwareApplicationSchema />
      <FAQPageSchema faqs={homepageFaqs} />

      <Header />
      <main className="pb-20 sm:pb-0">
        <HeroSection />
        <SectorShowcaseSection />
        <StarlySection />
        <FeaturesSection />
        <SectorsSection />
        <TestimonialsSection />
        <ComplianceSection />
        <PricingSection />
        <FAQSection
          faqs={homepageFaqs}
          title="Questions fréquentes"
          subtitle="Tout ce que vous devez savoir sur Starlinko"
          badgeText="FAQ"
        />
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
