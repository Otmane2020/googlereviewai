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

    const { businessId, website: providedWebsite, generateContent } = await req.json();

    if (!businessId) {
      throw new Error("businessId is required");
    }

    // Get business info from DB
    const { data: business, error: bizError } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      throw new Error("Business not found");
    }

    const website = providedWebsite || business.website;
    const gmbDescription = business.description;

    console.log(`[ANALYZE] Starting analysis for: ${business.name}`);
    console.log(`[ANALYZE] Website: ${website || "none"}`);
    console.log(`[ANALYZE] Generate content: ${generateContent ? "YES" : "NO"}`);

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    let websiteContent = "";
    let websiteMetadata: any = null;

    // Step 1: Scrape website with Firecrawl
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
            formats: ["markdown", "links"],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          websiteContent = scrapeData.data?.markdown || scrapeData.markdown || "";
          websiteMetadata = scrapeData.data?.metadata || scrapeData.metadata || null;
          console.log(`[ANALYZE] Firecrawl scraped ${websiteContent.length} chars`);
        } else {
          const errorText = await scrapeResponse.text();
          console.error(`[ANALYZE] Firecrawl error: ${scrapeResponse.status}`, errorText);
        }
      } catch (e) {
        console.error(`[ANALYZE] Firecrawl scrape failed:`, e);
      }
    }

    // Step 2: Combine content for analysis
    const fullContent = [
      websiteContent ? `CONTENU DU SITE WEB:\n${websiteContent.substring(0, 8000)}` : "",
      gmbDescription ? `DESCRIPTION GOOGLE MY BUSINESS:\n${gmbDescription}` : "",
      business.categories?.length ? `CATÉGORIES: ${business.categories.join(", ")}` : "",
      business.address ? `ADRESSE: ${business.address}` : "",
    ].filter(Boolean).join("\n\n");

    if (!fullContent) {
      console.log("[ANALYZE] No content to analyze");
      return new Response(
        JSON.stringify({ success: true, keywords: [], message: "Aucun contenu à analyser. Ajoutez un site web." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extractedKeywords: string[] = [];
    let generatedDescription = "";
    let aeoContent: any[] = [];
    let seoContent: any[] = [];

    // Step 3: AI Analysis - Keywords + Description + Optional AEO/SEO
    if (lovableApiKey) {
      try {
        console.log(`[ANALYZE] AI analysis on ${fullContent.length} chars`);

        const prompt = `Tu es un expert SEO local français. Analyse ce contenu d'entreprise et génère:

ENTREPRISE: ${business.name}
${fullContent.substring(0, 10000)}

GÉNÈRE CE JSON (sans markdown, juste le JSON):
{
  "keywords": ["15 mots-clés SEO pertinents pour cette entreprise locale"],
  "description": "Description marketing de 150-200 mots optimisée SEO, professionnelle et engageante",
  "aeo_questions": [
    {"question": "Question que les clients posent à ChatGPT/Google", "answer": "Réponse optimisée 100-150 mots"},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "seo_titles": [
    "5 idées de titres d'articles de blog SEO pour cette entreprise"
  ]
}

RÈGLES:
- Keywords: expressions 2-4 mots que les clients locaux recherchent
- Description: ton professionnel, mentionner la localisation, services principaux
- AEO: 3 questions fréquentes avec réponses complètes pour l'AI Engine Optimization
- SEO titles: titres d'articles captivants avec mots-clés locaux`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            max_tokens: 2000,
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
              console.log(`[ANALYZE] Extracted ${extractedKeywords.length} keywords`);
            }

            if (parsed.description && typeof parsed.description === "string") {
              generatedDescription = parsed.description;
              console.log(`[ANALYZE] Generated description: ${generatedDescription.length} chars`);
            }

            if (Array.isArray(parsed.aeo_questions)) {
              aeoContent = parsed.aeo_questions.slice(0, 5);
              console.log(`[ANALYZE] Generated ${aeoContent.length} AEO questions`);
            }

            if (Array.isArray(parsed.seo_titles)) {
              seoContent = parsed.seo_titles.slice(0, 5);
              console.log(`[ANALYZE] Generated ${seoContent.length} SEO titles`);
            }
          }
        } else {
          const errText = await aiResponse.text();
          console.error(`[ANALYZE] AI error: ${aiResponse.status}`, errText);
        }
      } catch (e) {
        console.error(`[ANALYZE] AI analysis failed:`, e);
      }
    }

    // Step 4: Update business with keywords and description
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (extractedKeywords.length > 0) {
      updateData.auto_keywords = extractedKeywords;
    }

    if (generatedDescription && !business.description) {
      // Only update description if it was empty
      updateData.description = generatedDescription;
    }

    if (Object.keys(updateData).length > 1) {
      const { error: updateError } = await supabaseAdmin
        .from("businesses")
        .update(updateData)
        .eq("id", businessId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error(`[ANALYZE] Failed to update business:`, updateError);
      } else {
        console.log(`[ANALYZE] Updated business with keywords and description`);
      }
    }

    // Step 5: Save AEO questions if generated and requested
    if (generateContent && aeoContent.length > 0) {
      for (const qa of aeoContent) {
        if (qa.question && qa.answer) {
          const { error: aeoError } = await supabaseAdmin
            .from("aeo_questions")
            .insert({
              user_id: user.id,
              business_id: businessId,
              question: qa.question,
              answer: qa.answer,
              keywords: extractedKeywords.slice(0, 5),
            });

          if (aeoError) {
            console.error(`[ANALYZE] Failed to save AEO question:`, aeoError);
          }
        }
      }
      console.log(`[ANALYZE] Saved ${aeoContent.length} AEO questions`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        keywords: extractedKeywords,
        description: generatedDescription || business.description,
        aeo_questions: aeoContent,
        seo_titles: seoContent,
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
