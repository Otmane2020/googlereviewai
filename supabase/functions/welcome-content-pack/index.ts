import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Identify user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Already delivered? skip
    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_content_delivered")
      .eq("id", userId)
      .single();

    if (profile?.welcome_content_delivered) {
      return new Response(JSON.stringify({ skipped: true, reason: "already_delivered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find first connected business (must have google_place_id to be publishable)
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, description, address, website_content, gmb_language, google_place_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .not("google_place_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!business) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_business" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const language = business.gmb_language || "fr";

    // Helper to call generate-seo-content
    const callGen = async (type: "seo_article" | "aeo_questions") => {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-seo-content`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          businessName: business.name,
          businessDescription: business.description,
          location: business.address,
          websiteContent: business.website_content,
          singleQuestion: type === "aeo_questions",
          language,
        }),
      });
      if (!res.ok) throw new Error(`gen failed: ${type} ${res.status}`);
      return await res.json();
    };

    let seoId: string | null = null;
    let qaId: string | null = null;

    // 1) SEO article
    try {
      const seoData = await callGen("seo_article");
      const article = seoData.article || seoData;
      const content = article.content || article.body;
      const title = article.title || `${business.name}`;
      if (content) {
        const { data: row } = await supabase
          .from("scheduled_content")
          .insert({
            user_id: userId,
            business_id: business.id,
            content_type: "seo_article",
            title,
            content,
            scheduled_date: today,
            status: "generated",
          })
          .select("id")
          .single();
        seoId = row?.id ?? null;
      }
    } catch (e) {
      console.error("[welcome-pack] SEO gen error", e);
    }

    // 2) AEO Q&A
    try {
      const qaData = await callGen("aeo_questions");
      const qa = qaData.questions?.[0];
      if (qa?.question && qa?.answer) {
        const { data: row } = await supabase
          .from("scheduled_content")
          .insert({
            user_id: userId,
            business_id: business.id,
            content_type: "aeo_qa",
            question: qa.question,
            answer: qa.answer,
            scheduled_date: today,
            status: "generated",
          })
          .select("id")
          .single();
        qaId = row?.id ?? null;
      }
    } catch (e) {
      console.error("[welcome-pack] QA gen error", e);
    }

    // 3) Publish to GMB (best-effort)
    let publishedSEO = false;
    let publishedQA = false;

    if (seoId) {
      try {
        const { error } = await supabase.functions.invoke("publish-gmb-post", {
          body: { business_id: business.id, post_id: seoId },
        });
        publishedSEO = !error;
      } catch (e) { console.error("[welcome-pack] publish SEO error", e); }
    }

    if (qaId) {
      try {
        const { error } = await supabase.functions.invoke("publish-gmb-qa", {
          body: { content_id: qaId },
        });
        publishedQA = !error;
      } catch (e) { console.error("[welcome-pack] publish QA error", e); }
    }

    // Mark as delivered (even if partial — to avoid retries spamming)
    await supabase
      .from("profiles")
      .update({ welcome_content_delivered: true })
      .eq("id", userId);

    return new Response(
      JSON.stringify({
        success: true,
        seo: { id: seoId, published: publishedSEO },
        qa: { id: qaId, published: publishedQA },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[welcome-pack] fatal", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
