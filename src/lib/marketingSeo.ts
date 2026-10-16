/** Public marketing SEO: one canonical brand, one production domain.
 * Metadata is emitted server-side by TanStack route.head, not only by React Helmet. */
export const REVIEWSAI_ORIGIN = "https://reviewsai.store";
export const homeSeo = {
  title: "ReviewsAI — AI Google Review Replies & Reputation Management",
  description: "Write on-brand replies to Google reviews with AI, manage Google Business Profile locations, get review alerts and explore local SEO/GEO tools. Try 3 free AI replies, no credit card.",
  canonical: REVIEWSAI_ORIGIN + "/",
  image: REVIEWSAI_ORIGIN + "/og-image.png",
};

export const softwareIdentity = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": REVIEWSAI_ORIGIN + "/#organization",
      name: "ReviewsAI",
      alternateName: "Reviews AI",
      url: REVIEWSAI_ORIGIN + "/",
      logo: {
        "@type": "ImageObject",
        url: REVIEWSAI_ORIGIN + "/icon-512x512.png",
      },
      email: "support@reviewsai.store",
      description: "Independent software for Google review management, AI-assisted replies and local search visibility.",
    },
    {
      "@type": "WebSite",
      "@id": REVIEWSAI_ORIGIN + "/#website",
      name: "ReviewsAI",
      url: REVIEWSAI_ORIGIN + "/",
      inLanguage: ["en", "fr"],
      description: homeSeo.description,
      publisher: { "@id": REVIEWSAI_ORIGIN + "/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": REVIEWSAI_ORIGIN + "/#software",
      name: "ReviewsAI",
      description: homeSeo.description,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Reputation Management Software",
      operatingSystem: "Web",
      inLanguage: ["en", "fr"],
      url: REVIEWSAI_ORIGIN + "/",
      image: homeSeo.image,
      isAccessibleForFree: true,
      publisher: { "@id": REVIEWSAI_ORIGIN + "/#organization" },
      offers: {
        "@type": "Offer",
        url: REVIEWSAI_ORIGIN + "/",
        price: "0",
        priceCurrency: "EUR",
        description: "3 complimentary AI review reply credits, no card required; paid plans available.",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        "Google Business Profile review management",
        "AI-assisted Google review response drafting",
        "Google review notifications",
        "Multi-location review workflows on eligible plans",
        "Custom business voice and signature",
        "Google Business Profile and local SEO/GEO features on eligible plans",
      ],
      potentialAction: {
        "@type": "RegisterAction",
        target: REVIEWSAI_ORIGIN + "/auth",
        name: "Try three AI review replies for free",
      },
    },
  ],
};

/** Escape JSON-LD for safe inline script content. */
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
