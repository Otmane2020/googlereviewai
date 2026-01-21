import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to sync reviews for a single business
// Helper function to sync reviews for a single business
// Returns new review IDs for notification
async function syncBusinessReviews(
  accessToken: string,
  locationId: string,
  userId: string,
  supabase: any
): Promise<{ synced: number; newReviewIds: string[]; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  const newReviewIds: string[] = [];

  try {
    // Get existing review IDs for this location BEFORE sync
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("review_id")
      .eq("user_id", userId)
      .eq("location_id", locationId);
    
    const existingReviewIds = new Set(existingReviews?.map((r: any) => r.review_id) || []);

    // Fetch reviews from Google
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationId}/reviews`;
    const response = await fetch(reviewsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch reviews for ${locationId}:`, errorText);
      errors.push(`Location ${locationId}: ${response.status}`);
      return { synced, newReviewIds, errors };
    }

    const data = await response.json();
    const reviews = data.reviews || [];

    for (const review of reviews) {
      const reviewId = review.reviewId || review.name?.split("/").pop();
      const reviewer = review.reviewer || {};
      const isNewReview = !existingReviewIds.has(reviewId);
      
      const reviewData = {
        review_id: reviewId,
        user_id: userId,
        location_id: locationId,
        author: reviewer.displayName || "Anonyme",
        rating: review.starRating ? parseInt(review.starRating.replace("STAR_", "").replace("_", "")) || 5 : 5,
        comment: review.comment || null,
        review_date: review.createTime || new Date().toISOString(),
        // Mark as not notified if it's a new review - trigger will handle notification
        notified: isNewReview ? false : true,
      };

      // Upsert review - trigger will fire and send notification for new reviews
      const { error: upsertError } = await supabase
        .from("reviews")
        .upsert(reviewData, { 
          onConflict: "review_id,user_id",
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error(`Error upserting review ${reviewId}:`, upsertError);
      } else {
        synced++;
        if (isNewReview) {
          newReviewIds.push(reviewId);
          console.log(`[CRON] New review detected: ${reviewId} by ${reviewData.author}`);
        }
      }
    }
  } catch (error) {
    console.error(`Exception syncing ${locationId}:`, error);
    errors.push(`Location ${locationId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { synced, newReviewIds, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // CRON uses SERVICE_ROLE only - no user session
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CRON] Starting autonomous sync reviews job...");

    // Get all users with auto_sync_reviews enabled AND a refresh token
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("user_id, auto_sync_reviews, auto_publish_to_google, minimum_rating")
      .eq("auto_sync_reviews", true);

    if (settingsError) {
      console.error("[CRON] Error fetching settings:", settingsError);
      throw new Error("Failed to fetch AI settings");
    }

    if (!settings || settings.length === 0) {
      console.log("[CRON] No users with auto-sync enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No users to sync", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CRON] Found ${settings.length} users with auto-sync enabled`);

    let totalSynced = 0;
    let totalNewReviews = 0;
    let usersProcessed = 0;
    let usersSkipped = 0;
    const errors: string[] = [];

    for (const userSettings of settings) {
      let userSynced = 0;
      let userNewReviews = 0;
      const userErrors: string[] = [];

      try {
        // Get access token using shared helper (SERVICE_ROLE client)
        const tokenResult = await getGoogleAccessToken(supabase, userSettings.user_id);

        if (!tokenResult.token) {
          console.log(`[CRON] User ${userSettings.user_id}: ${tokenResult.error || 'No token'}`);
          usersSkipped++;
          
          // Update sync status for this user
          await supabase
            .from("ai_settings")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: "error",
              last_sync_error: tokenResult.error || "No token available",
            })
            .eq("user_id", userSettings.user_id);
          continue;
        }

        const accessToken = tokenResult.token;

        // Get user's businesses
        const { data: businesses, error: businessError } = await supabase
          .from("businesses")
          .select("id, name, google_place_id")
          .eq("user_id", userSettings.user_id)
          .eq("is_active", true);

        if (businessError || !businesses || businesses.length === 0) {
          console.log(`[CRON] No businesses for user ${userSettings.user_id}`);
          continue;
        }

        console.log(`[CRON] Syncing ${businesses.length} businesses for user ${userSettings.user_id}`);

        // Sync each business - notifications are handled by the trigger
        for (const business of businesses) {
          if (!business.google_place_id) continue;

          const result = await syncBusinessReviews(
            accessToken,
            business.google_place_id,
            userSettings.user_id,
            supabase
          );

          userSynced += result.synced;
          userNewReviews += result.newReviewIds.length;
          userErrors.push(...result.errors);
        }

        totalSynced += userSynced;
        totalNewReviews += userNewReviews;
        errors.push(...userErrors);

        // Update sync status for this user
        await supabase
          .from("ai_settings")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: userErrors.length > 0 ? "partial" : "success",
            last_sync_error: userErrors.length > 0 ? userErrors.join("; ") : null,
            reviews_synced_count: userSynced,
          })
          .eq("user_id", userSettings.user_id);

        console.log(`[CRON] User ${userSettings.user_id}: synced ${userSynced} reviews, ${userNewReviews} new`);
        usersProcessed++;
      } catch (userError) {
        console.error(`[CRON] Error processing user ${userSettings.user_id}:`, userError);
        const errorMsg = userError instanceof Error ? userError.message : 'Unknown error';
        errors.push(`User ${userSettings.user_id}: ${errorMsg}`);
        
        // Update sync status on error
        await supabase
          .from("ai_settings")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "error",
            last_sync_error: errorMsg,
          })
          .eq("user_id", userSettings.user_id);
      }
    }

    // After syncing, trigger auto-respond if there are new reviews
    if (totalNewReviews > 0) {
      try {
        console.log("[CRON] Triggering auto-respond-reviews for new reviews...");
        await fetch(`${supabaseUrl}/functions/v1/auto-respond-reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
        });
      } catch (autoRespondError) {
        console.error("[CRON] Failed to trigger auto-respond:", autoRespondError);
      }
    }

    const message = `[CRON] Autonomous sync completed. Processed ${usersProcessed} users (${usersSkipped} skipped), synced ${totalSynced} reviews, ${totalNewReviews} new reviews detected.`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        users_processed: usersProcessed,
        users_skipped: usersSkipped,
        reviews_synced: totalSynced,
        new_reviews: totalNewReviews,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
