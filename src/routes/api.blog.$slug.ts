import { createFileRoute } from "@tanstack/react-router";
import { getPublishedRankiArticle } from "@/integrations/supabase/rankiBlogClient";

export const Route = createFileRoute("/api/blog/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const article = await getPublishedRankiArticle(params.slug);
          if (!article) {
            return Response.json({ ok: false, error: "Article not found" }, { status: 404 });
          }
          return Response.json({ ok: true, article });
        } catch (error) {
          console.error("[api/blog] failed", error);
          return Response.json({ ok: false, error: "Unable to load article" }, { status: 500 });
        }
      },
    },
  },
});
