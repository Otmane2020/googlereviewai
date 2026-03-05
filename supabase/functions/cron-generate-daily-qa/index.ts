import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Check if user has daily plan (paid upgrade)
async function hasDailyPlan(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_name, subscription_status")
    .eq("id", userId)
    .single();

  if (!profile) return false;
  const validStatuses = ["active", "trial", "trialing"];
  if (!validStatuses.includes(profile.subscription_status || "")) return false;
  const dailyPlans = ["daily", "pro", "business"];
  return dailyPlans.includes((profile.plan_name || "").toLowerCase());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CRON-AEO] Starting daily Q&A generation...");

    // Get ALL users (app is free now)
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, plan_name, subscription_status");

    const eligibleUserIds = (allProfiles || []).map((p: any) => p.id);
    console.log(`[CRON-AEO] Total users: ${eligibleUserIds.length}`);

    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay(); // 0=Sunday, 1=Monday
    let generatedCount = 0;
    let errorCount = 0;

    for (const userId of eligibleUserIds) {
      try {
        const isDailyUser = await hasDailyPlan(supabase, userId);

        // Free users: generate only on Mondays
        if (!isDailyUser && dayOfWeek !== 1) {
          continue;
        }

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
              language: business.gmb_language || "fr",
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
        console.error(`[CRON-AEO] Error for user ${userId}:`, userError);
        errorCount++;
      }
    }

    console.log(`[CRON-AEO] Done. Generated: ${generatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ success: true, generated: generatedCount, errors: errorCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CRON-AEO] Fatal:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
