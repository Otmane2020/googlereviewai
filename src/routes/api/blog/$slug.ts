import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/blog/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data } = await sb
          .from("ranki_articles")
          .select("id, title, slug, excerpt, content_html, cover_url, keywords, published_at, updated_at")
          .eq("slug", params.slug)
          .eq("status", "published")
          .maybeSingle();
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json(data);
      },
    },
  },
});
