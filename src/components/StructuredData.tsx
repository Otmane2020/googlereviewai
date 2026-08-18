import { Helmet } from "react-helmet";

const BRAND_NAME = "Google Review AI";
const SITE_URL = "https://googlereviewai.com";
const LOGO_URL = `${SITE_URL}/icon-512x512.svg`;

export const OrganizationSchema = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: BRAND_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: LOGO_URL,
        },
        description:
          "Google Review AI is an AI-powered platform for Google review management, Google Business Profile automation, local SEO and local AI visibility.",
        email: "support@googlereviewai.com",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@googlereviewai.com",
          availableLanguage: ["English", "French"],
        },
      })}
    </script>
  </Helmet>
);

export const WebSiteSchema = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: BRAND_NAME,
        alternateName: "GoogleReviewAI",
        url: SITE_URL,
        description:
          "AI-powered Google review responses, Google Business Profile automation, local SEO and Local AEO tools for businesses.",
        inLanguage: ["en", "fr"],
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      })}
    </script>
  </Helmet>
);

export const SoftwareApplicationSchema = ({
  name = BRAND_NAME,
  description = "AI-powered Google review management, review response automation, Google Business Profile publishing, local rank tracking and Local AEO tools.",
  price = "0",
  priceCurrency = "EUR",
  operatingSystem = "Web",
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
        "@id": `${SITE_URL}/#software`,
        name,
        url: SITE_URL,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Reputation Management Software",
        operatingSystem,
        description,
        brand: {
          "@type": "Brand",
          name: BRAND_NAME,
        },
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        offers: {
          "@type": "Offer",
          price,
          priceCurrency,
          url: `${SITE_URL}/pricing`,
        },
        featureList: [
          "Google review monitoring",
          "AI-generated Google review responses",
          "Automatic and assisted review reply publishing",
          "Google Business Profile synchronization",
          "Google Business Profile post automation",
          "Google Maps rank tracking",
          "Local SEO recommendations",
          "Local AEO and AI-search visibility analysis",
          "Multi-business management",
        ],
      })}
    </script>
  </Helmet>
);

export const FAQPageSchema = ({ faqs }: { faqs: { question: string; answer: string }[] }) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      })}
    </script>
  </Helmet>
);

export const BreadcrumbSchema = ({ items }: { items: { name: string; url: string }[] }) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      })}
    </script>
  </Helmet>
);

export const ProductSchema = ({
  name = "Google Review AI",
  description = "Google review management and local visibility software with AI-assisted replies and Google Business Profile automation.",
  price = "0",
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
        name,
        description,
        url: `${SITE_URL}/pricing`,
        brand: {
          "@type": "Brand",
          name: BRAND_NAME,
        },
        offers: {
          "@type": "Offer",
          price,
          priceCurrency,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/pricing`,
        },
      })}
    </script>
  </Helmet>
);
