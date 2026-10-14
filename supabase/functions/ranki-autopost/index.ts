import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import sanitizeHtml from "npm:sanitize-html@2.17.0";

const MAX_BODY_BYTES = 1024 * 1024;
const SITE_URL = "https://googlereviewai.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, authorization, apikey, x-api-key, x-ranki-webhook-secret",
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

const textFromHtml = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();

const getBearerToken = (req: Request) => {
  const authorization = req.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
};

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

  // This endpoint can trigger a publication on a customer's Google profile.
  // It must never accept an unauthenticated public request.
  const webhookSecret = Deno.env.get("RANKI_WEBHOOK_SECRET") || Deno.env.get("ARTICLE_API_KEY");
  if (!webhookSecret) {
    return json({ ok: false, error: "Ranki webhook authentication is not configured" }, 500);
  }
  const suppliedSecret =
    req.headers.get("x-ranki-webhook-secret") ||
    req.headers.get("x-api-key") ||
    getBearerToken(req);
  if (suppliedSecret !== webhookSecret) {
    return json({ ok: false, error: "Invalid Ranki webhook credentials" }, 401);
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

  const businessId =
    (typeof body.business_id === "string" ? body.business_id.trim() : "") ||
    Deno.env.get("RANKI_GOOGLE_BUSINESS_ID") ||
    "";
  if (!businessId) {
    return json({
      ok: false,
      error: "business_id is required to publish this Ranki article on Google",
    }, 422);
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, user_id, google_place_id, is_active")
    .eq("id", businessId)
    .single();

  if (businessError || !business || !business.is_active || !business.google_place_id) {
    return json({
      ok: false,
      error: "The configured business is missing, inactive, or not connected to Google",
    }, 422);
  }

  // A retry from Ranki must not create a duplicate Google post.
  const { data: existingArticle } = await supabase
    .from("ranki_articles")
    .select("id, slug, business_id, google_publish_status, google_post_id")
    .eq("slug", slug)
    .maybeSingle();

  if (
    existingArticle?.google_publish_status === "published" &&
    existingArticle.google_post_id &&
    existingArticle.business_id === business.id
  ) {
    return json({
      ok: true,
      id: existingArticle.id,
      slug: existingArticle.slug,
      url: `${SITE_URL}/blog/${existingArticle.slug}`,
      google: { status: "published", post_id: existingArticle.google_post_id },
      deduplicated: true,
    });
  }

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
        business_id: business.id,
        google_publish_status: "publishing",
        google_publish_error: null,
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

  const summarySource =
    (typeof body.google_summary === "string" && body.google_summary.trim()) ||
    (typeof body.excerpt === "string" && body.excerpt.trim()) ||
    textFromHtml(sanitizedHtml);
  const summary = summarySource.slice(0, 1500).trim();

  if (!summary) {
    await supabase
      .from("ranki_articles")
      .update({ google_publish_status: "failed", google_publish_error: "Empty Google post content" })
      .eq("id", data.id);
    return json({ ok: false, error: "Article contains no text suitable for Google" }, 422);
  }

  const { data: googleResult, error: googleInvokeError } = await supabase.functions.invoke(
    "publish-gmb-post",
    {
      body: {
        business_id: business.id,
        user_id: business.user_id,
        summary,
        topic_type: "STANDARD",
      },
    },
  );

  const googlePostId = googleResult?.google_post_id || googleResult?.post?.name || null;
  if (googleInvokeError || !googleResult?.success || !googlePostId) {
    const googleError =
      googleResult?.error || googleInvokeError?.message || "Google did not confirm the publication";
    console.error("[ranki-autopost] Google publication failed", googleError);
    await supabase
      .from("ranki_articles")
      .update({
        google_publish_status: "failed",
        google_publish_error: String(googleError).slice(0, 2000),
      })
      .eq("id", data.id);
    return json({ ok: false, error: googleError, google: { status: "failed" } }, 502);
  }

  const googlePublishedAt = new Date().toISOString();
  const { error: trackingError } = await supabase
    .from("ranki_articles")
    .update({
      google_publish_status: "published",
      google_post_id: googlePostId,
      google_publish_error: null,
      google_published_at: googlePublishedAt,
    })
    .eq("id", data.id);

  if (trackingError) {
    console.error("[ranki-autopost] Google published, but tracking update failed", trackingError);
  }

  return json({
    ok: true,
    id: data.id,
    slug: data.slug,
    url: `${SITE_URL}/blog/${data.slug}`,
    google: {
      status: "published",
      post_id: googlePostId,
      published_at: googlePublishedAt,
    },
    tracking_warning: trackingError ? "Google published, but local tracking update failed" : null,
  });
});
