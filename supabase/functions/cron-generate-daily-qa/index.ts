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

    console.log("Starting daily Q&A generation cron job...");

    // Get all active subscriptions for AEO module
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        user_id,
        profiles!inner (id, email)
      `)
      .eq("module", "aeo_rank")
      .eq("status", "active");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} active AEO subscriptions`);

    const today = new Date().toISOString().split("T")[0];
    let generatedCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions || []) {
      try {
        const userId = subscription.user_id;

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

          // Generate Q&A using AI
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
              keywords: randomKeyword ? [randomKeyword] : [],
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
        console.error(`Error processing user ${subscription.user_id}:`, userError);
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
