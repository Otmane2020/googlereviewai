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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CRON-AEO] Starting daily Q&A generation cron job...");

    // Get eligible users: either AEO subscription OR Pro/Business plan
    const userIds = new Set<string>();

    // 1. Get users with active AEO module subscription
    const { data: aeoSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("module", "aeo_rank")
      .eq("status", "active");

    aeoSubs?.forEach(s => userIds.add(s.user_id));
    console.log(`[CRON-AEO] Found ${aeoSubs?.length || 0} active AEO module subscriptions`);

    // 2. Get users with Pro or Business plan (they get AEO included)
    const { data: paidUsers } = await supabase
      .from("profiles")
      .select("id, plan_name")
      .in("plan_name", ["pro", "Pro", "business", "Business"]);

    paidUsers?.forEach(p => userIds.add(p.id));
    console.log(`[CRON-AEO] Found ${paidUsers?.length || 0} users with Pro/Business plans`);

    const eligibleUserIds = Array.from(userIds);
    console.log(`[CRON-AEO] Total eligible users: ${eligibleUserIds.length}`);

    const today = new Date().toISOString().split("T")[0];
    let generatedCount = 0;
    let errorCount = 0;

    for (const userId of eligibleUserIds) {
      try {
        console.log(`[CRON-AEO] Processing user ${userId}...`);

        // Get user's active businesses
        const { data: businesses, error: bizError } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (bizError || !businesses?.length) {
          console.log(`No active businesses for user ${userId}`);
          continue;
        }

        for (const business of businesses) {
          // Check if Q&A already exists for today
          const { data: existingContent } = await supabase
            .from("scheduled_content")
            .select("id")
            .eq("business_id", business.id)
            .eq("content_type", "aeo_qa")
            .eq("scheduled_date", today)
            .single();

          if (existingContent) {
            console.log(`Q&A already exists for business ${business.id} on ${today}`);
            continue;
          }

          // Get a random keyword for this business
          const { data: keywords } = await supabase
            .from("keywords")
            .select("name")
            .eq("business_id", business.id)
            .eq("is_active", true);

          const randomKeyword = keywords?.length 
            ? keywords[Math.floor(Math.random() * keywords.length)].name 
            : null;

          // Récupérer les 10 dernières questions pour éviter les doublons
          const { data: recentQuestions } = await supabase
            .from("scheduled_content")
            .select("question")
            .eq("business_id", business.id)
            .eq("content_type", "aeo_qa")
            .order("created_at", { ascending: false })
            .limit(10);

          const existingQuestionsList = recentQuestions?.map(q => q.question).filter(Boolean) || [];
          console.log(`[CRON-AEO] Found ${existingQuestionsList.length} recent questions to avoid for business ${business.id}`);

          // Generate Q&A using AI - passer les questions existantes pour éviter doublons + website pour Firecrawl
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
              websiteUrl: business.website, // Pass website for Firecrawl scraping
              keywords: randomKeyword ? [randomKeyword, ...existingQuestionsList] : existingQuestionsList,
              singleQuestion: true,
            }),
          });

          if (!aiResponse.ok) {
            console.error(`AI generation failed for business ${business.id}`);
            errorCount++;
            continue;
          }

          const aiData = await aiResponse.json();
          const qa = aiData.questions?.[0];

          if (!qa) {
            console.error(`No Q&A generated for business ${business.id}`);
            errorCount++;
            continue;
          }

          // Save to scheduled_content
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

          if (insertError) {
            console.error(`Error saving Q&A for business ${business.id}:`, insertError);
            errorCount++;
          } else {
            generatedCount++;
            console.log(`Generated Q&A for business ${business.name}`);
          }
        }
      } catch (userError) {
        console.error(`[CRON-AEO] Error processing user ${userId}:`, userError);
        errorCount++;
      }
    }

    console.log(`Cron job completed. Generated: ${generatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: generatedCount,
        errors: errorCount,
        message: `Generated ${generatedCount} Q&As with ${errorCount} errors` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in cron-generate-daily-qa:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
