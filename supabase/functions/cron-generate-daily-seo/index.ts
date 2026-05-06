import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callOpenRouterWithFallback } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get current hour in a specific timezone
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hourStr = formatter.format(now);
    return parseInt(hourStr, 10);
  } catch (error) {
    console.error(`[CRON-SEO] Invalid timezone ${timezone}, falling back to UTC:`, error);
    return new Date().getUTCHours();
  }
}

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

    console.log("[CRON-SEO] Starting hourly SEO content generation check...");

    // Get all users with their publication settings
    const { data: allUserSettings, error: usersError } = await supabase
      .from("ai_settings")
      .select("user_id, publication_hour, timezone");

    if (usersError) {
      console.error("[CRON-SEO] Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`[CRON-SEO] Checking ${allUserSettings?.length || 0} users`);

    // Filter users whose publication is in 2 hours (generate content ahead of time)
    const usersToGenerate = (allUserSettings || []).filter((userSetting) => {
      const timezone = userSetting.timezone || "Europe/Paris";
      const currentLocalHour = getCurrentHourInTimezone(timezone);
      const publicationHour = userSetting.publication_hour ?? 7;
      
      // Generate content 2 hours before publication time
      const generationHour = (publicationHour - 2 + 24) % 24;
      const shouldGenerate = currentLocalHour === generationHour;
      
      if (shouldGenerate) {
        console.log(`[CRON-SEO] User ${userSetting.user_id}: Local time is ${currentLocalHour}:00 (${timezone}), generating for publication at ${publicationHour}:00`);
      }
      return shouldGenerate;
    });

    console.log(`[CRON-SEO] Found ${usersToGenerate.length} users ready for generation`);

    let generatedCount = 0;
    let errorCount = 0;

    for (const userSetting of usersToGenerate) {
      const userId = userSetting.user_id;
      
      try {
        console.log(`[CRON-SEO] Processing user ${userId}...`);

        // Check if user has daily plan or is free (weekly only)
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_name, subscription_status")
          .eq("id", userId)
          .single();

        const validStatuses = ["active", "trial", "trialing"];
        const dailyPlans = ["daily", "pro", "business"];
        const isDailyUser = profile && 
          validStatuses.includes(profile.subscription_status || "") &&
          dailyPlans.includes((profile.plan_name || "").toLowerCase());

        // Free users: generate only on Mondays
        const timezone = userSetting.timezone || "Europe/Paris";
        const today = getTodayInTimezone(timezone);
        const dayOfWeek = new Date().getDay();

        if (!isDailyUser && dayOfWeek !== 1) {
          console.log(`[CRON-SEO] User ${userId}: free plan, skipping (not Monday)`);
          continue;
        }

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
            let content: string;
            try {
              content = (await callOpenRouterWithFallback({
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                ],
                max_tokens: 1000,
                temperature: 0.7,
                title: "Starlinko SEO Generator",
                apiKey: openRouterApiKey,
              })).trim();
            } catch (err) {
              console.error(`[CRON-SEO] OpenRouter all-models error for ${business.name}:`, err);
              errorCount++;
              continue;
            }

            if (!content) {
              console.error(`[CRON-SEO] No content generated for article ${article.id}`);
              errorCount++;
              continue;
            }

            // Update the article with generated content
            const { error: updateError } = await supabase
              .from("scheduled_content")
              .update({
                content: content.slice(0, 1500),
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
        users_checked: allUserSettings?.length || 0,
        users_generating: usersToGenerate.length,
        generated: generatedCount,
        errors: errorCount,
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
