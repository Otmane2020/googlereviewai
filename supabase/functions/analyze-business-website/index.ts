import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { businessId, website, gmbDescription } = await req.json();

    if (!businessId) {
      throw new Error("businessId is required");
    }

    console.log(`[ANALYZE] Starting analysis for business ${businessId}`);
    console.log(`[ANALYZE] Website: ${website || "none"}`);
    console.log(`[ANALYZE] GMB Description: ${gmbDescription?.substring(0, 100) || "none"}...`);

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    let websiteContent = "";
    let extractedKeywords: string[] = [];

    // Step 1: Scrape website with Firecrawl if available
    if (website && firecrawlApiKey) {
      try {
        let formattedUrl = website.trim();
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
          formattedUrl = `https://${formattedUrl}`;
        }

        console.log(`[ANALYZE] Scraping with Firecrawl: ${formattedUrl}`);

        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 2000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          websiteContent = scrapeData.data?.markdown || scrapeData.markdown || "";
          console.log(`[ANALYZE] Firecrawl scraped ${websiteContent.length} chars`);
        } else {
          console.error(`[ANALYZE] Firecrawl error: ${scrapeResponse.status}`);
        }
      } catch (e) {
        console.error(`[ANALYZE] Firecrawl scrape failed:`, e);
      }
    }

    // Step 2: Combine website content + GMB description for analysis
    const fullContent = [
      websiteContent ? `CONTENU DU SITE WEB:\n${websiteContent.substring(0, 5000)}` : "",
      gmbDescription ? `DESCRIPTION GOOGLE MY BUSINESS:\n${gmbDescription}` : "",
    ].filter(Boolean).join("\n\n");

    if (!fullContent) {
      console.log("[ANALYZE] No content to analyze");
      return new Response(
        JSON.stringify({ success: true, keywords: [], message: "No content to analyze" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Use AI to extract keywords
    if (lovableApiKey) {
      try {
        console.log(`[ANALYZE] Extracting keywords with AI from ${fullContent.length} chars`);

        const prompt = `Analyse ce contenu et extrais les mots-clés SEO les plus pertinents pour améliorer la visibilité de cette entreprise.

${fullContent.substring(0, 6000)}

RÈGLES:
1. Extrais 10-15 mots-clés/expressions pertinents
2. Focus sur: services, produits, localisation, spécialités
3. Inclus des expressions longue traîne (2-4 mots)
4. Priorise les termes que les clients rechercheraient
5. Évite les mots trop génériques (qualité, service, professionnel...)

Réponds UNIQUEMENT avec ce JSON:
{
  "keywords": ["mot-clé 1", "expression clé 2", "service spécifique", ...]
}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content?.trim() || "";
          
          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.keywords)) {
              extractedKeywords = parsed.keywords
                .filter((k: any) => typeof k === "string" && k.length > 2)
                .slice(0, 15);
              console.log(`[ANALYZE] AI extracted ${extractedKeywords.length} keywords:`, extractedKeywords);
            }
          }
        }
      } catch (e) {
        console.error(`[ANALYZE] AI keyword extraction failed:`, e);
      }
    }

    // Step 4: Update business with keywords
    if (extractedKeywords.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("businesses")
        .update({ 
          auto_keywords: extractedKeywords,
          updated_at: new Date().toISOString(),
        })
        .eq("id", businessId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error(`[ANALYZE] Failed to update business:`, updateError);
      } else {
        console.log(`[ANALYZE] Updated business with ${extractedKeywords.length} keywords`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        keywords: extractedKeywords,
        websiteAnalyzed: !!websiteContent,
        gmbAnalyzed: !!gmbDescription,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ANALYZE] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
