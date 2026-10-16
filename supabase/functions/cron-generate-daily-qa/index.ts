import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { activePlanTier } from "../_shared/plan-access.ts";
import { gmbContentLanguage } from "../_shared/content-language.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Check if user has daily plan (paid upgrade)
async function hasDailyPlan(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_name,subscription_status,current_period_end,trial_end")
    .eq("id", userId).single();
  return ["pro", "business"].includes(activePlanTier(profile));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CRON-GEO] Starting daily Q&A generation...");

    // Only current premium subscriptions can generate scheduled Google Q&A.
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, plan_name, subscription_status, current_period_end, trial_end");

    const eligibleUserIds = (allProfiles || []).filter((p: any) => ["pro", "business"].includes(activePlanTier(p))).map((p: any) => p.id);
    console.log(`[CRON-GEO] Total users: ${eligibleUserIds.length}`);

    const today = new Date().toISOString().split("T")[0];
    let generatedCount = 0;
    let errorCount = 0;

    for (const userId of eligibleUserIds) {
      try {
        const isDailyUser = await hasDailyPlan(supabase, userId);

        if (!isDailyUser) continue;

        const { data: businesses } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (!businesses?.length) continue;

        for (const business of businesses) {
          // Check if Q&A already exists for today
          const { data: existingContent } = await supabase
            .from("scheduled_content")
            .select("id")
            .eq("business_id", business.id)
            .eq("content_type", "aeo_qa")
            .eq("scheduled_date", today)
            .single();

          if (existingContent) continue;

          const { data: keywords } = await supabase
            .from("keywords")
            .select("name")
            .eq("business_id", business.id)
            .eq("is_active", true);

          const randomKeyword = keywords?.length
            ? keywords[Math.floor(Math.random() * keywords.length)].name
            : null;

          const { data: recentQuestions } = await supabase
            .from("scheduled_content")
            .select("question")
            .eq("business_id", business.id)
            .eq("content_type", "aeo_qa")
            .order("created_at", { ascending: false })
            .limit(10);

          const existingQuestionsList = recentQuestions?.map((q: any) => q.question).filter(Boolean) || [];

          const aiResponse = await fetch(`${supabaseUrl}/functions/v1/generate-seo-content`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "aeo_questions",
              businessName: business.name,
              businessDescription: business.description,
              location: business.address,
              websiteContent: business.website_content,
              keywords: randomKeyword ? [randomKeyword, ...existingQuestionsList] : existingQuestionsList,
              singleQuestion: true,
              language: gmbContentLanguage(business.gmb_language, "fr"),
            }),
          });

          if (!aiResponse.ok) { errorCount++; continue; }

          const aiData = await aiResponse.json();
          const qa = aiData.questions?.[0];
          if (!qa) { errorCount++; continue; }

          const { error: insertError } = await supabase
            .from("scheduled_content")
            .insert({
              user_id: userId,
              business_id: business.id,
              content_type: "aeo_qa",
              question: qa.question,
              answer: qa.answer,
              keyword_used: randomKeyword,
              scheduled_date: today,
              status: "pending",
            });

          if (insertError) { errorCount++; } else { generatedCount++; }
        }
      } catch (userError) {
        console.error(`[CRON-GEO] Error for user ${userId}:`, userError);
        errorCount++;
      }
    }

    console.log(`[CRON-GEO] Done. Generated: ${generatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ success: true, generated: generatedCount, errors: errorCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CRON-GEO] Fatal:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
