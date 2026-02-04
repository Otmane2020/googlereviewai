import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get today's date in a specific timezone
function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CRON-SEO] Starting daily SEO content generation...");

    // Get eligible users: SEO subscription OR Pro/Business plan
    const userIds = new Set<string>();

    // 1. Get users with active SEO module subscription
    const { data: seoSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("module", "seo_autopost")
      .eq("status", "active");

    seoSubs?.forEach(s => userIds.add(s.user_id));
    console.log(`[CRON-SEO] Found ${seoSubs?.length || 0} active SEO module subscriptions`);

    // 2. Get users with Pro or Business plan (they get SEO included)
    const { data: paidUsers } = await supabase
      .from("profiles")
      .select("id, plan_name")
      .in("plan_name", ["pro", "Pro", "business", "Business"]);

    paidUsers?.forEach(p => userIds.add(p.id));
    console.log(`[CRON-SEO] Found ${paidUsers?.length || 0} users with Pro/Business plans`);

    const eligibleUserIds = Array.from(userIds);
    console.log(`[CRON-SEO] Total eligible users: ${eligibleUserIds.length}`);

    let generatedCount = 0;
    let errorCount = 0;

    for (const userId of eligibleUserIds) {
      try {
        console.log(`[CRON-SEO] Processing user ${userId}...`);

        // Get user timezone
        const { data: aiSettings } = await supabase
          .from("ai_settings")
          .select("timezone")
          .eq("user_id", userId)
          .single();

        const timezone = aiSettings?.timezone || "Europe/Paris";
        const today = getTodayInTimezone(timezone);

        // Get user's active businesses
        const { data: businesses, error: bizError } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (bizError || !businesses?.length) {
          console.log(`[CRON-SEO] No active businesses for user ${userId}`);
          continue;
        }

        for (const business of businesses) {
          // Get pending SEO articles for today that don't have content yet
          const { data: pendingArticles } = await supabase
            .from("scheduled_content")
            .select("*")
            .eq("business_id", business.id)
            .eq("content_type", "seo_article")
            .eq("scheduled_date", today)
            .eq("status", "pending")
            .is("content", null)
            .limit(1);

          if (!pendingArticles?.length) {
            console.log(`[CRON-SEO] No pending articles for business ${business.name} on ${today}`);
            continue;
          }

          const article = pendingArticles[0];
          console.log(`[CRON-SEO] Generating content for article: ${article.title}`);

          // Build the prompt for content generation
          const systemPrompt = `Tu es un expert en SEO local et en rédaction de contenu pour Google Business Profile.
Génère un article SEO de 200-300 mots maximum optimisé pour la publication Google My Business.

RÈGLES STRICTES:
- L'article doit être informatif et engageant
- Inclure naturellement des mots-clés SEO locaux
- Le contenu doit être adapté au format Google Posts (1500 caractères max)
- Ton professionnel mais accessible
- Inclure un appel à l'action à la fin
- Ne pas utiliser de markdown, titres ou formatage spécial
- Écrire en ${business.gmb_language === "en" ? "anglais" : "français"}`;

          const userPrompt = `Écris un article SEO pour Google My Business basé sur:

Titre: ${article.title}
Établissement: ${business.name}
Adresse: ${business.address || "Non spécifiée"}
Description: ${business.description || "Non spécifiée"}
${business.website_content ? `\nContexte du site web:\n${business.website_content.substring(0, 2000)}` : ""}

Génère UNIQUEMENT le contenu de l'article (pas le titre), prêt à être publié sur Google.`;

          try {
            const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://starlinko.com",
                "X-Title": "Starlinko SEO Generator",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                ],
                max_tokens: 1000,
                temperature: 0.7,
              }),
            });

            if (!aiResponse.ok) {
              const errorText = await aiResponse.text();
              console.error(`[CRON-SEO] OpenRouter error for ${business.name}:`, errorText);
              errorCount++;
              continue;
            }

            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content?.trim();

            if (!content) {
              console.error(`[CRON-SEO] No content generated for article ${article.id}`);
              errorCount++;
              continue;
            }

            // Update the article with generated content
            const { error: updateError } = await supabase
              .from("scheduled_content")
              .update({
                content: content.slice(0, 1500), // Limit to GMB max
                status: "generated",
                updated_at: new Date().toISOString(),
              })
              .eq("id", article.id);

            if (updateError) {
              console.error(`[CRON-SEO] Error updating article ${article.id}:`, updateError);
              errorCount++;
            } else {
              generatedCount++;
              console.log(`[CRON-SEO] ✅ Generated content for: ${article.title}`);
            }
          } catch (aiError) {
            console.error(`[CRON-SEO] AI generation error:`, aiError);
            errorCount++;
          }
        }
      } catch (userError) {
        console.error(`[CRON-SEO] Error processing user ${userId}:`, userError);
        errorCount++;
      }
    }

    console.log(`[CRON-SEO] ========================================`);
    console.log(`[CRON-SEO] ✅ Generated ${generatedCount} articles, ${errorCount} errors`);
    console.log(`[CRON-SEO] ========================================`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: generatedCount,
        errors: errorCount,
        message: `Generated ${generatedCount} SEO articles with ${errorCount} errors` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[CRON-SEO] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
