import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import sanitizeHtml from "npm:sanitize-html@2.17.0";

const MAX_BODY_BYTES = 1024 * 1024;
const SITE_URL = "https://googlereviewai.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const cleanHtml = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span"
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["id", "class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true)
    }
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Payload too large" }, 413);
  }

  let raw = "";
  try {
    raw = await req.text();
  } catch {
    return json({ ok: false, error: "Invalid request body" }, 400);
  }

  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "Payload too large" }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  if (body.type === "ranki.test") {
    return json({ ok: true });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const html = typeof body.html === "string" ? body.html.trim() : "";

  if (!title || !slug || !html) {
    return json({ ok: false, error: "title, slug and html are required" }, 400);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) {
    return json({ ok: false, error: "Invalid slug" }, 400);
  }

  const publishedAt =
    typeof body.published_at === "string" && !Number.isNaN(Date.parse(body.published_at))
      ? new Date(body.published_at).toISOString()
      : new Date().toISOString();

  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  const sanitizedHtml = cleanHtml(html);
  if (!sanitizedHtml.trim()) {
    return json({ ok: false, error: "html contains no publishable content" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, error: "Supabase runtime is not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("ranki_articles")
    .upsert(
      {
        title,
        slug,
        excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() || null : null,
        content_html: sanitizedHtml,
        content_markdown: typeof body.markdown === "string" ? body.markdown : null,
        cover_url: typeof body.cover_url === "string" ? body.cover_url.trim() || null : null,
        keywords,
        content_type: typeof body.content_type === "string" ? body.content_type.trim() || null : null,
        status: "published",
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id, slug")
    .single();

  if (error) {
    console.error("[ranki-autopost] upsert failed", error);
    return json({ ok: false, error: "Failed to publish article" }, 500);
  }

  return json({
    ok: true,
    id: data.id,
    slug: data.slug,
    url: `${SITE_URL}/blog/${data.slug}`,
  });
});
