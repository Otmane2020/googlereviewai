import { createFileRoute } from "@tanstack/react-router";
import FreeGoogleReviewReplyFR from "@/pages/FreeGoogleReviewReplyFR";
import { jsonLd, REVIEWSAI_ORIGIN } from "@/lib/marketingSeo";

const canonical = REVIEWSAI_ORIGIN + "/reponse-avis-google-ia-gratuit";
const title = "Répondre aux avis Google gratuitement avec l'IA | ReviewsAI";
const description = "3 réponses IA gratuites aux avis Google, sans carte bancaire. Exemples de réponses positives et négatives, guide Google Business Profile et bonnes pratiques.";

export const Route = createFileRoute("/reponse-avis-google-ia-gratuit")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: "fr_FR" },
      { property: "og:image", content: REVIEWSAI_ORIGIN + "/og-image.png" },
    ],
    links: [{ rel: "canonical", href: canonical }],
    scripts: [{
      type: "application/ld+json",
      children: jsonLd({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebPage",
            "@id": canonical + "#webpage",
            name: title,
            description,
            url: canonical,
            inLanguage: "fr",
            isPartOf: { "@id": REVIEWSAI_ORIGIN + "/#website" },
            about: { "@id": REVIEWSAI_ORIGIN + "/#software" },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "ReviewsAI", item: REVIEWSAI_ORIGIN + "/" },
              { "@type": "ListItem", position: 2, name: "Répondre aux avis Google avec l'IA", item: canonical },
            ],
          },
        ],
      }),
    }],
  }),
  component: FreeGoogleReviewReplyFR,
});
