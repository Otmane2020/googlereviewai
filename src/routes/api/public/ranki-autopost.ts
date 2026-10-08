import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const SITE_URL = "https://googlereviewai.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const schema = z
  .object({
    title: z.string().trim().min(1).max(500),
    slug: z.string().trim().min(1).max(300),
    html: z.string().min(1),
    excerpt: z.string().max(2000).nullish(),
    markdown: z.string().nullish(),
    cover_url: z.string().max(2000).nullish(),
    keywords: z.array(z.string().max(200)).max(100).nullish(),
    published_at: z.string().nullish(),
    content_type: z.string().max(100).nullish(),
  })
  .passthrough();

export const Route = createFileRoute("/api/public/ranki-autopost")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 200, headers: cors }),
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 1_000_000) return json({ ok: false, error: "Payload too large" }, 413);
        let body: any;
        try { body = JSON.parse(raw); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
        if (body?.type === "ranki.test") return json({ ok: true });

        const parsed = schema.safeParse(body);
        if (!parsed.success) return json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() }, 400);
        const d = parsed.data;
        const slug = d.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (!slug) return json({ ok: false, error: "Invalid slug" }, 400);
        const publishedAt = d.published_at && !isNaN(Date.parse(d.published_at)) ? new Date(d.published_at).toISOString() : new Date().toISOString();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("ranki_articles")
          .upsert(
            {
              title: d.title,
              slug,
              excerpt: d.excerpt ?? null,
              content_html: d.html,
              content_markdown: d.markdown ?? null,
              cover_url: d.cover_url ?? null,
              keywords: d.keywords ?? null,
              content_type: d.content_type ?? null,
              status: "published",
              published_at: publishedAt,
            },
            { onConflict: "slug" },
          )
          .select("id, slug")
          .single();
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true, id: data.id, slug: data.slug, url: `${SITE_URL}/blog/${data.slug}` });
      },
    },
  },
});
