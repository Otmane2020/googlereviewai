import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_description: string | null;
}

async function translate(article: Article): Promise<{ title: string; body: string; meta_description: string }> {
  const prompt = `You are a professional EN translator for a SaaS blog called GoogleReviewAI (Generative Engine Optimization for local businesses).

Translate the following French article into clear, natural, professional US English. Preserve ALL HTML tags, structure and formatting EXACTLY. Keep the same meaning. Replace any "GoogleReviewAI" mentions with "GoogleReviewAI". Keep technical terms like "Google Business Profile", "ChatGPT", "Gemini", "Perplexity", "GEO", "AEO", "SEO" untouched.

Return ONLY a strict JSON object with keys: title, body, meta_description. No markdown, no commentary.

INPUT:
TITLE: ${article.title}
META: ${article.meta_description ?? ""}
BODY: ${article.body}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You translate French marketing/blog content into US English. Output strict JSON only with keys title, body, meta_description." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const parsed = JSON.parse(content);
  return {
    title: parsed.title || article.title,
    body: parsed.body || article.body,
    meta_description: parsed.meta_description || article.meta_description || "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { batch_size = 5, only_id } = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let query = supabase
      .from("published_articles")
      .select("id, slug, title, body, meta_description")
      .or("translated_to_en.is.null,translated_to_en.eq.false")
      .limit(batch_size);
    if (only_id) query = supabase.from("published_articles").select("id, slug, title, body, meta_description").eq("id", only_id);

    const { data: articles, error } = await query;
    if (error) throw error;

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ done: true, message: "No articles left to translate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    for (const article of articles as Article[]) {
      try {
        const translated = await translate(article);
        const { error: upErr } = await supabase
          .from("published_articles")
          .update({
            title: translated.title,
            body: translated.body,
            meta_description: translated.meta_description,
            translated_to_en: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", article.id);
        if (upErr) throw upErr;
        results.push({ id: article.id, slug: article.slug, ok: true });
        console.log(`[translate] ${article.slug} OK`);
      } catch (e) {
        console.error(`[translate] ${article.slug} FAIL:`, e);
        results.push({ id: article.id, slug: article.slug, ok: false, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[translate] fatal:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
