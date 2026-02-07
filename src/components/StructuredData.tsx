import { Helmet } from "react-helmet";

// Organization schema - used on homepage
export const OrganizationSchema = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Starlinko",
        "url": "https://starlinko.app",
        "logo": "https://starlinko.app/og-image.png",
        "description": "Starlinko est une plateforme IA pour la gestion automatique des avis Google, le SEO local et l'optimisation AEO (Answer Engine Optimization) pour les entreprises locales.",
        "foundingDate": "2024",
        "sameAs": [],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "availableLanguage": ["French", "English"],
          "url": "https://starlinko.app"
        },
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "0",
          "highPrice": "39",
          "priceCurrency": "EUR",
          "offerCount": "3"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "500",
          "bestRating": "5",
          "worstRating": "1"
        }
      })}
    </script>
  </Helmet>
);

// WebSite schema with search - used on homepage
export const WebSiteSchema = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Starlinko",
        "url": "https://starlinko.app",
        "description": "IA pour Google Business Profile & Avis Google – Réponses automatiques, SEO local, AEO ChatGPT",
        "inLanguage": ["fr", "en"],
        "publisher": {
          "@type": "Organization",
          "name": "Starlinko"
        }
      })}
    </script>
  </Helmet>
);

// SoftwareApplication schema - used on homepage and product pages
export const SoftwareApplicationSchema = ({
  name = "Starlinko",
  description = "Plateforme IA tout-en-un pour la gestion des avis Google, le SEO local automatisé et l'optimisation AEO pour ChatGPT et les moteurs de réponse IA.",
  price = "0",
  priceCurrency = "EUR",
  ratingValue = "4.8",
  ratingCount = "500",
  operatingSystem = "Web, Android",
}: {
  name?: string;
  description?: string;
  price?: string;
  priceCurrency?: string;
  ratingValue?: string;
  ratingCount?: string;
  operatingSystem?: string;
}) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Reputation Management",
        "operatingSystem": operatingSystem,
        "description": description,
        "url": "https://starlinko.app",
        "offers": {
          "@type": "Offer",
          "price": price,
          "priceCurrency": priceCurrency,
          "description": "Essai gratuit 7 jours, puis à partir de 32,50€/mois"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": ratingValue,
          "ratingCount": ratingCount,
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "Réponses automatiques IA aux avis Google",
          "SEO local automatisé",
          "Optimisation AEO pour ChatGPT et Gemini",
          "Publications automatiques Google Business Profile",
          "Dashboard de suivi de réputation",
          "Support multilingue"
        ]
      })}
    </script>
  </Helmet>
);

// FAQPage schema - used on content/guide pages
export const FAQPageSchema = ({ faqs }: { faqs: { question: string; answer: string }[] }) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      })}
    </script>
  </Helmet>
);

// BreadcrumbList schema
export const BreadcrumbSchema = ({ items }: { items: { name: string; url: string }[] }) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      })}
    </script>
  </Helmet>
);

// Product schema for pricing pages
export const ProductSchema = ({
  name = "Starlinko Pack Complet",
  description = "Solution IA tout-en-un : réponses aux avis Google, SEO local, AEO ChatGPT, publications automatiques.",
  price = "32.50",
  priceCurrency = "EUR",
}: {
  name?: string;
  description?: string;
  price?: string;
  priceCurrency?: string;
}) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "description": description,
        "brand": {
          "@type": "Brand",
          "name": "Starlinko"
        },
        "offers": {
          "@type": "Offer",
          "price": price,
          "priceCurrency": priceCurrency,
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2027-12-31",
          "url": "https://starlinko.app/select-plan"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "500",
          "bestRating": "5",
          "worstRating": "1"
        },
        "review": [
          {
            "@type": "Review",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Marie D."
            },
            "reviewBody": "Service impeccable ! L'équipe est très professionnelle et à l'écoute. Je recommande vivement."
          },
          {
            "@type": "Review",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Pierre L."
            },
            "reviewBody": "Starlinko a transformé notre gestion des avis. Gain de temps considérable et réponses de qualité."
          }
        ]
      })}
    </script>
  </Helmet>
);
