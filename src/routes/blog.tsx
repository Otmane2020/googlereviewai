import { createFileRoute } from "@tanstack/react-router";
import Blog from "@/pages/Blog";
import { getPublishedRankiArticles } from "@/integrations/supabase/rankiBlogClient";

export const Route = createFileRoute("/blog")({
  ssr: true,
  loader: async () => {
    try {
      return await getPublishedRankiArticles();
    } catch (error) {
      console.error("[blog loader] unable to load Ranki articles", error);
      return [];
    }
  },
  head: () => ({
    meta: [
      { title: "Google Reviews, Local SEO & AI Search Guides | Google Review AI" },
      {
        name: "description",
        content: "Practical guides on Google review management, Google Business Profile optimization, Google Maps rankings, local SEO and AI search visibility.",
      },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://googlereviewai.com/blog" },
      { property: "og:title", content: "Google Review AI Guides — Reviews, Local SEO & AI Search" },
      { property: "og:description", content: "Actionable guides for improving review management and local visibility." },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/blog" }],
  }),
  component: BlogRoute,
});

function BlogRoute() {
  const articles = Route.useLoaderData();
  return <Blog initialRankiArticles={articles} />;
}
