import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RankiHero } from "@/components/ranki/RankiHero";
import { GeoRankSection } from "@/components/ranki/GeoRankSection";
import { HowItWorksSection } from "@/components/ranki/HowItWorksSection";
import { ReviewsAISection } from "@/components/ranki/ReviewsAISection";
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
      question: "What is GEO (Generative Engine Optimization)?",
      answer:
        "GEO is the discipline of making sure your business shows up — and ranks first — inside answers from generative AI engines like ChatGPT, Gemini, Perplexity and Claude. It's the AI-era successor to local SEO.",
    },
    {
      question: "How does Ranki.ai know my rank in ChatGPT or Gemini?",
      answer:
        "Ranki runs real prompts on each AI engine for the local queries you care about (e.g. 'best dentist in Miami'), parses the answers, and tracks whether your business is mentioned, where in the list, and against which competitors.",
    },
    {
      question: "Will Ranki actually improve my AI ranking?",
      answer:
        "Yes. Ranki auto-publishes AI-optimized Q&A and SEO posts on your Google Business Profile — the very content sources LLMs index — and answers reviews on-brand. Over a few weeks this dramatically increases your share-of-voice in AI answers.",
    },
    {
      question: "Do I need a Google Business Profile?",
      answer:
        "Yes. Ranki connects to Google Business Profile to pull reviews, publish content and align signals across Google Search, Google Maps and AI search engines.",
    },
    {
      question: "Is there a free plan?",
      answer:
        "Yes. The Starter plan is free forever and includes weekly GEO rank reports, AI review replies and 25 monthly credits. Upgrade to Daily ($9.99/mo) for daily tracking and daily auto-publishing.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Ranki.ai – Rank Locally in ChatGPT, Gemini & Perplexity</title>
        <meta
          name="description"
          content="Ranki.ai is the GEO platform that tracks and boosts your local business ranking inside ChatGPT, Gemini and Perplexity. Reviews AI, GEO rank, local SEO – all in one."
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
          title="Everything about Ranki.ai"
          subtitle="The GEO platform built for local businesses."
          badgeText="FAQ"
        />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
