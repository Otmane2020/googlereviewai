import { createFileRoute } from "@tanstack/react-router";
import Blog from "@/pages/Blog";
import { seoArticles } from "@/data/seoArticles";
import { jsonLd, REVIEWSAI_ORIGIN } from "@/lib/marketingSeo";

const canonical = REVIEWSAI_ORIGIN + "/blog";
const title = "Google Review Reply Guides, Local SEO & GEO | ReviewsAI";
const description = "Practical Google review response examples, AI reply workflows, Google Business Profile checklists and local SEO/GEO explainers for small businesses.";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: REVIEWSAI_ORIGIN + "/og-image.png" },
    ],
    links: [{ rel: "canonical", href: canonical }],
    scripts: [{
      type: "application/ld+json",
      children: jsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "ReviewsAI Guides",
        description,
        url: canonical,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: seoArticles.slice(0, 18).map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: article.title,
            url: REVIEWSAI_ORIGIN + "/blog/" + article.slug,
          })),
        },
      }),
    }],
  }),
  component: Blog,
});
