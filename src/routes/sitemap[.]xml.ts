import { createFileRoute } from "@tanstack/react-router";
import { seoArticles } from "@/data/seoArticles";
import { getPublishedRankiArticles } from "@/integrations/supabase/rankiBlogClient";

const SITE = "https://googlereviewai.com";

const fixedUrls = [
  "/",
  "/ai-google-review-reply",
  "/google-review-response-generator",
  "/google-review-management",
  "/ai-review-reply-generator",
  "/google-business-review-replies",
  "/review-management-software",
  "/blog",
  "/local-aeo",
  "/gmb-autoposting",
  "/avis-ai-guide",
  "/avis-ai-restaurant",
  "/avis-ai-hotel",
  "/restaurants",
  "/hotels",
  "/checklist",
  "/qr-gratuit",
  "/shop",
  "/sitemap",
  "/privacy",
  "/terms",
  "/review-reply-ai-google-business-profile",
];

const xmlEscape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const urlNode = (loc: string, lastmod?: string | null, priority?: string) => {
  const normalizedDate = lastmod ? new Date(lastmod).toISOString().slice(0, 10) : null;
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    normalizedDate ? `    <lastmod>${normalizedDate}</lastmod>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    "  </url>",
  ].filter(Boolean).join("\n");
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let rankiArticles: Awaited<ReturnType<typeof getPublishedRankiArticles>> = [];
        try {
          rankiArticles = await getPublishedRankiArticles();
        } catch (error) {
          console.error("[sitemap] unable to load Ranki articles", error);
        }

        const nodes = [
          ...fixedUrls.map((path) => urlNode(`${SITE}${path}`, path === "/" ? "2026-09-26" : undefined, path === "/" ? "1.0" : undefined)),
          ...seoArticles.map((article) => urlNode(`${SITE}/blog/${article.slug}`, article.updatedAt || article.publishedAt, "0.8")),
          ...rankiArticles.map((article) => urlNode(
            `${SITE}/blog/${article.slug}`,
            article.updated_at || article.published_at || article.created_at,
            "0.8",
          )),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>\n`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
          },
        });
      },
    },
  },
});
