import { useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";
import ProductHuntLanding from "@/components/launch/ProductHuntLanding";

/** Primary ReviewsAI homepage, also served via the /landing marketing alias. */
const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const fr = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase().startsWith("fr");

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Public SEO HTML remains SSR-renderable while authentication resolves.
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" aria-label={fr ? "Ouverture de votre espace" : "Opening your dashboard"}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = fr
    ? "ReviewsAI — Répondez aux avis Google avec l’IA | Réputation & visibilité locale"
    : "ReviewsAI — AI Replies for Google Reviews | Local Reputation Management";
  const description = fr
    ? "Préparez des réponses IA naturelles aux avis Google, gardez le contrôle de vos établissements et suivez votre réputation locale. 3 réponses IA gratuites, sans carte bancaire."
    : "Draft thoughtful, on-brand Google review replies with AI, manage your locations and stay on top of your local reputation. Try 3 free AI replies. No credit card.";
  const locale = fr ? "fr_FR" : "en_US";
  const language = fr ? "fr" : "en";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://reviewsai.store/#organization",
        name: "ReviewsAI",
        url: "https://reviewsai.store/",
        logo: "https://reviewsai.store/icon-512x512.png",
        email: "support@reviewsai.store",
      },
      {
        "@type": "WebSite",
        "@id": "https://reviewsai.store/#website",
        name: "ReviewsAI",
        url: "https://reviewsai.store/",
        inLanguage: language,
        description,
        publisher: { "@id": "https://reviewsai.store/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://reviewsai.store/#software",
        name: "ReviewsAI",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://reviewsai.store/",
        description,
        inLanguage: language,
        publisher: { "@id": "https://reviewsai.store/#organization" },
        featureList: [
          "AI-drafted Google review replies",
          "Google Business Profile review management",
          "Review alerts",
          "Brand voice and signature customization",
          "Local search visibility features on eligible plans",
        ],
      },
    ],
  };

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <link rel="canonical" href="https://reviewsai.store/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ReviewsAI" />
        <meta property="og:url" content="https://reviewsai.store/" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://reviewsai.store/og-image.png" />
        <meta property="og:locale" content={locale} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://reviewsai.store/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <ProductHuntLanding />
    </>
  );
};

export default Index;
