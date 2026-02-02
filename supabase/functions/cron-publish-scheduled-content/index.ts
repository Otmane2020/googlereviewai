import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.error(`[CRON-PUBLISH] Invalid timezone ${timezone}, falling back to UTC:`, error);
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
    return formatter.format(now); // Returns YYYY-MM-DD format
  } catch (error) {
    console.error(`[CRON-PUBLISH] Invalid timezone ${timezone}, falling back to UTC:`, error);
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const utcNow = new Date();
    console.log(`[CRON-PUBLISH] Starting publication check at ${utcNow.toISOString()}`);

    // Get all users with their publication settings including timezone
    const { data: allUserSettings, error: usersError } = await supabase
      .from("ai_settings")
      .select("user_id, publication_hour, timezone");

    if (usersError) {
      console.error("[CRON-PUBLISH] Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`[CRON-PUBLISH] Checking ${allUserSettings?.length || 0} users for publication time`);

    // Filter users whose local time matches their publication_hour
    const usersToPublish = (allUserSettings || []).filter((userSetting) => {
      const timezone = userSetting.timezone || "Europe/Paris";
      const currentLocalHour = getCurrentHourInTimezone(timezone);
      const publicationHour = userSetting.publication_hour ?? 7;
      
      const shouldPublish = currentLocalHour === publicationHour;
      if (shouldPublish) {
        console.log(`[CRON-PUBLISH] User ${userSetting.user_id}: Local time is ${currentLocalHour}:00 (${timezone}), matches publication_hour ${publicationHour}`);
      }
      return shouldPublish;
    });

    console.log(`[CRON-PUBLISH] Found ${usersToPublish.length} users ready for publication`);

    let publishedAEO = 0;
    let publishedSEO = 0;
    let errors = 0;

    for (const userSetting of usersToPublish) {
      const userId = userSetting.user_id;
      const timezone = userSetting.timezone || "Europe/Paris";
      const today = getTodayInTimezone(timezone);
      
      console.log(`[CRON-PUBLISH] Processing user ${userId} (timezone: ${timezone}, today: ${today})`);

      // Get user's active businesses
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, google_place_id")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (!businesses?.length) {
        console.log(`[CRON-PUBLISH] No active businesses for user ${userId}`);
        continue;
      }

      for (const business of businesses) {
        // Skip if no Google connection
        if (!business.google_place_id) {
          console.log(`[CRON-PUBLISH] Business ${business.id} has no Google place ID, skipping`);
          continue;
        }

        // 1. Publish AEO Q&A for today
        const { data: aeoContent } = await supabase
          .from("scheduled_content")
          .select("*")
          .eq("business_id", business.id)
          .eq("user_id", userId)
          .eq("content_type", "aeo_qa")
          .eq("scheduled_date", today)
          .eq("status", "generated")
          .is("published_at", null)
          .limit(1)
          .single();

        if (aeoContent && aeoContent.question && aeoContent.answer) {
          try {
            console.log(`[CRON-PUBLISH] Publishing AEO Q&A ${aeoContent.id} for business ${business.name}`);
            
            const { data: publishResult, error: publishError } = await supabase.functions.invoke(
              "publish-gmb-qa",
              {
                body: { content_id: aeoContent.id },
              }
            );

            if (publishError) {
              console.error(`[CRON-PUBLISH] AEO publish error:`, publishError);
              errors++;
            } else {
              publishedAEO++;
              console.log(`[CRON-PUBLISH] ✅ AEO Q&A published successfully`);
            }
          } catch (err) {
            console.error(`[CRON-PUBLISH] AEO publish exception:`, err);
            errors++;
          }
        }

        // 2. Publish SEO article for today
        const { data: seoContent } = await supabase
          .from("scheduled_content")
          .select("*")
          .eq("business_id", business.id)
          .eq("user_id", userId)
          .eq("content_type", "seo_article")
          .eq("scheduled_date", today)
          .in("status", ["generated", "pending"])
          .is("published_at", null)
          .limit(1)
          .single();

        if (seoContent && seoContent.content) {
          try {
            console.log(`[CRON-PUBLISH] Publishing SEO article ${seoContent.id} for business ${business.name}`);
            
            const { data: publishResult, error: publishError } = await supabase.functions.invoke(
              "publish-gmb-post",
              {
                body: {
                  business_id: business.id,
                  summary: seoContent.content.slice(0, 1500),
                  post_id: seoContent.id,
                },
              }
            );

            if (publishError) {
              console.error(`[CRON-PUBLISH] SEO publish error:`, publishError);
              errors++;
            } else {
              publishedSEO++;
              console.log(`[CRON-PUBLISH] ✅ SEO article published successfully`);
            }
          } catch (err) {
            console.error(`[CRON-PUBLISH] SEO publish exception:`, err);
            errors++;
          }
        }
      }
    }

    console.log(`[CRON-PUBLISH] ========================================`);
    console.log(`[CRON-PUBLISH] ✅ Published ${publishedAEO} AEO, ${publishedSEO} SEO, ${errors} errors`);
    console.log(`[CRON-PUBLISH] ========================================`);

    return new Response(
      JSON.stringify({
        success: true,
        utc_time: utcNow.toISOString(),
        users_checked: allUserSettings?.length || 0,
        users_published: usersToPublish.length,
        published_aeo: publishedAEO,
        published_seo: publishedSEO,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CRON-PUBLISH] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
