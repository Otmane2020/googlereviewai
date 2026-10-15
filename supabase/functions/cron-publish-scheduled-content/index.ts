import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hasSeoAutomationAccess } from "../_shared/plan-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  } catch {
    return new Date().getUTCHours();
  }
}

function getDayOfWeekInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "narrow",
    });
    // Get the actual day number (0=Sunday)
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = dateFormatter.formatToParts(now);
    const dateStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
    return new Date(dateStr).getDay();
  } catch {
    return new Date().getDay();
  }
}

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

// Check if user has daily plan (paid upgrade)
async function hasDailyPlan(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_name, subscription_status, current_period_end, trial_end")
    .eq("id", userId)
    .single();

  return await hasSeoAutomationAccess(supabase, userId, profile);
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
    console.log(`[CRON-PUBLISH] Starting at ${utcNow.toISOString()}`);

    const { data: allUserSettings, error: usersError } = await supabase
      .from("ai_settings")
      .select("user_id, publication_hour, timezone");

    if (usersError) throw usersError;

    console.log(`[CRON-PUBLISH] Checking ${allUserSettings?.length || 0} users`);

    const usersToPublish = (allUserSettings || []).filter((s: any) => {
      const tz = s.timezone || "Europe/Paris";
      return getCurrentHourInTimezone(tz) === (s.publication_hour ?? 7);
    });

    console.log(`[CRON-PUBLISH] ${usersToPublish.length} users at publication hour`);

    let publishedAEO = 0, publishedSEO = 0, errors = 0;

    for (const userSetting of usersToPublish) {
      const userId = userSetting.user_id;
      const timezone = userSetting.timezone || "Europe/Paris";
      const today = getTodayInTimezone(timezone);
      const dayOfWeek = getDayOfWeekInTimezone(timezone);
      const isDailyUser = await hasDailyPlan(supabase, userId);

      // Automatic Google publishing belongs to Pro and Business only.
      if (!isDailyUser) continue;

      console.log(`[CRON-PUBLISH] User ${userId}: ${isDailyUser ? "daily" : "weekly"} (${timezone}, ${today})`);

      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, google_place_id")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (!businesses?.length) continue;

      for (const business of businesses) {
        if (!business.google_place_id) continue;

        // Google discontinued the Business Profile Q&A API on 2025-11-03.
        // Keep generated questions and answers as drafts for the user to reuse
        // on their website/FAQ, and never report these as published to Google.
        // See https://developers.google.com/my-business/content/qanda/change-log
        // Publish SEO article
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

        if (seoContent?.content) {
          try {
            // Rotate business update / practical advice / product-or-service spotlight.
            // Spotlight is a STANDARD post; we never invent a real discount.
            const day = Math.floor(Date.parse(today + "T00:00:00Z") / 86400000);
            const modes = ["news", "information", "spotlight"] as const;
            const editorialMode = modes[((day % 3) + 3) % 3];
            const { data: result, error: publishError } = await supabase.functions.invoke("publish-gmb-post", {
              body: {
                business_id: business.id,
                user_id: userId,
                summary: seoContent.content.slice(0, 1500),
                scheduled_content_id: seoContent.id,
                editorial_mode: editorialMode,
                topic_type: "STANDARD",
              },
            });
            if (publishError || !result?.success) {
              console.error("[CRON-PUBLISH] Google Business post failed:", result?.error || publishError?.message);
              errors++;
            } else {
              publishedSEO++;
            }
          } catch { errors++; }
        }
      }
    }

    console.log(`[CRON-PUBLISH] ✅ GEO:${publishedAEO} SEO:${publishedSEO} Errors:${errors}`);

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
    console.error("[CRON-PUBLISH] Fatal:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
