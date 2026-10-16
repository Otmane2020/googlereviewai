import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { homeSeo, jsonLd, softwareIdentity } from "@/lib/marketingSeo";

export const Route = createFileRoute("/")({
  // SEO tags and JSON-LD must be in the server-rendered HTML for crawlers.
  head: () => ({
    meta: [
      { title: homeSeo.title },
      { name: "description", content: homeSeo.description },
      { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ReviewsAI" },
      { property: "og:url", content: homeSeo.canonical },
      { property: "og:title", content: homeSeo.title },
      { property: "og:description", content: homeSeo.description },
      { property: "og:image", content: homeSeo.image },
      { property: "og:image:alt", content: "ReviewsAI — AI replies for Google reviews" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: homeSeo.title },
      { name: "twitter:description", content: homeSeo.description },
      { name: "twitter:image", content: homeSeo.image },
    ],
    links: [{ rel: "canonical", href: homeSeo.canonical }],
    scripts: [{ type: "application/ld+json", children: jsonLd(softwareIdentity) }],
  }),
  component: Index,
});
