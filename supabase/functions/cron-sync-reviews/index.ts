import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Star rating mapping from Google API format
const starMapping: Record<string, number> = {
  "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5,
  "STAR_RATING_UNSPECIFIED": 0
};

// Parse star rating from Google API response
function parseStarRating(starRating: string | number | undefined): number {
  if (typeof starRating === "number") return starRating;
  if (typeof starRating === "string") return starMapping[starRating] || 5;
  return 5;
}

// Fetch all GMB accounts for a user
async function fetchGMBAccounts(accessToken: string): Promise<{ accounts: any[]; error?: string }> {
  try {
    const response = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CRON] Failed to fetch GMB accounts:", response.status, errorText);
      return { accounts: [], error: `Failed to fetch accounts: ${response.status}` };
    }

    const data = await response.json();
    return { accounts: data.accounts || [] };
  } catch (error) {
    console.error("[CRON] Exception fetching GMB accounts:", error);
    return { accounts: [], error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Fetch locations for a GMB account
async function fetchGMBLocations(accessToken: string, accountName: string): Promise<{ locations: any[]; error?: string }> {
  try {
    const response = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CRON] Failed to fetch locations for ${accountName}:`, response.status);
      return { locations: [], error: `Failed to fetch locations: ${response.status}` };
    }

    const data = await response.json();
    return { locations: data.locations || [] };
  } catch (error) {
    console.error(`[CRON] Exception fetching locations for ${accountName}:`, error);
    return { locations: [], error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Sync reviews for a specific location
async function syncLocationReviews(
  accessToken: string,
  accountId: string,
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
    console.log(`[CRON] Location ${locationId}: ${existingReviewIds.size} existing reviews in DB`);

    // CORRECT URL FORMAT: /v4/accounts/{accountId}/locations/{locationId}/reviews
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`;
    console.log(`[CRON] Fetching reviews from: ${reviewsUrl}`);
    
    const response = await fetch(reviewsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CRON] Failed to fetch reviews for location ${locationId}:`, response.status, errorText);
      
      if (response.status === 404) {
        errors.push(`Location ${locationId}: No reviews endpoint (might be new listing)`);
      } else if (response.status === 403) {
        errors.push(`Location ${locationId}: Permission denied`);
      } else {
        errors.push(`Location ${locationId}: Error ${response.status}`);
      }
      return { synced, newReviewIds, errors };
    }

    const data = await response.json();
    const reviews = data.reviews || [];
    console.log(`[CRON] Found ${reviews.length} reviews for location ${locationId}`);

    for (const review of reviews) {
      const fullReviewId = review.name || review.reviewId;
      if (!fullReviewId) {
        console.error("[CRON] Review has no ID:", review);
        continue;
      }

      // Build canonical review ID
      const reviewIdParts = fullReviewId.split("/reviews/");
      const uniqueReviewId = reviewIdParts.length > 1 ? reviewIdParts[1] : fullReviewId;
      const canonicalReviewId = `locations/${locationId}/reviews/${uniqueReviewId}`;

      const isNewReview = !existingReviewIds.has(canonicalReviewId);
      const rating = parseStarRating(review.starRating);

      const reviewData = {
        review_id: canonicalReviewId,
        user_id: userId,
        location_id: locationId,
        author: review.reviewer?.displayName || "Anonyme",
        rating: rating,
        comment: review.comment || "",
        review_date: review.createTime || new Date().toISOString(),
        replied: !!review.reviewReply,
        google_reply: review.reviewReply?.comment || null,
        // Mark as NOT notified if it's truly new - trigger will handle notification
        notified: !isNewReview,
      };

      // Upsert review - trigger will fire and send notification for new reviews
      const { error: upsertError } = await supabase
        .from("reviews")
        .upsert(reviewData, { 
          onConflict: "review_id,user_id",
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error(`[CRON] Error upserting review ${canonicalReviewId}:`, upsertError);
      } else {
        synced++;
        if (isNewReview) {
          newReviewIds.push(canonicalReviewId);
          console.log(`[CRON] 🆕 NEW REVIEW DETECTED: ${canonicalReviewId} by ${reviewData.author} (${rating}⭐)`);
        }
      }
    }
  } catch (error) {
    console.error(`[CRON] Exception syncing location ${locationId}:`, error);
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

    console.log("[CRON] ========================================");
    console.log("[CRON] Starting autonomous sync reviews job...");
    console.log("[CRON] ========================================");

    // Get all users with auto_sync_reviews enabled
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
          console.log(`[CRON] User ${userSettings.user_id}: ${tokenResult.error || 'No refresh token available'}`);
          usersSkipped++;
          
          // Update sync status for this user
          await supabase
            .from("ai_settings")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: "error",
              last_sync_error: tokenResult.error || "No refresh token available",
            })
            .eq("user_id", userSettings.user_id);
          continue;
        }

        const accessToken = tokenResult.token;
        console.log(`[CRON] ✅ Got access token for user ${userSettings.user_id}`);

        // Step 1: Fetch ALL GMB accounts for this user
        const { accounts, error: accountsError } = await fetchGMBAccounts(accessToken);
        
        if (accountsError || accounts.length === 0) {
          console.log(`[CRON] User ${userSettings.user_id}: No GMB accounts found`);
          userErrors.push(accountsError || "No GMB accounts");
          
          await supabase
            .from("ai_settings")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: "error",
              last_sync_error: accountsError || "No GMB accounts found",
            })
            .eq("user_id", userSettings.user_id);
          continue;
        }

        console.log(`[CRON] Found ${accounts.length} GMB accounts for user ${userSettings.user_id}`);

        // Get user's saved businesses (to match locations)
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, name, google_place_id")
          .eq("user_id", userSettings.user_id)
          .eq("is_active", true);

        const savedLocationIds = new Set((businesses || []).map((b: any) => b.google_place_id).filter(Boolean));
        console.log(`[CRON] User has ${savedLocationIds.size} active businesses in DB`);

        // Step 2: For each account, get locations and sync reviews
        for (const account of accounts) {
          const accountName = account.name; // e.g., "accounts/123456789"
          const accountId = accountName.split("/")[1];
          console.log(`[CRON] Processing account: ${accountName}`);

          // Fetch locations for this account
          const { locations, error: locationsError } = await fetchGMBLocations(accessToken, accountName);
          
          if (locationsError) {
            userErrors.push(`Account ${accountId}: ${locationsError}`);
            continue;
          }

          console.log(`[CRON] Found ${locations.length} locations in account ${accountId}`);

          // Step 3: Sync reviews for each location that matches user's businesses
          for (const location of locations) {
            const locationName = location.name; // e.g., "locations/15834486420159917356"
            const locationId = locationName.split("/")[1];

            // Only sync if this location is in user's saved businesses
            if (!savedLocationIds.has(locationId)) {
              console.log(`[CRON] Skipping location ${locationId} - not in user's businesses`);
              continue;
            }

            console.log(`[CRON] 📍 Syncing reviews for location: ${location.title || locationId}`);

            const result = await syncLocationReviews(
              accessToken,
              accountId,
              locationId,
              userSettings.user_id,
              supabase
            );

            userSynced += result.synced;
            userNewReviews += result.newReviewIds.length;
            userErrors.push(...result.errors);
          }
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

        console.log(`[CRON] User ${userSettings.user_id}: synced ${userSynced} reviews, ${userNewReviews} NEW`);
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
        console.log(`[CRON] 🚀 Triggering auto-respond-reviews for ${totalNewReviews} new reviews...`);
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

    const message = `Processed ${usersProcessed} users (${usersSkipped} skipped), synced ${totalSynced} reviews, ${totalNewReviews} NEW reviews detected.`;
    console.log(`[CRON] ========================================`);
    console.log(`[CRON] ✅ ${message}`);
    console.log(`[CRON] ========================================`);

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
    console.error("[CRON] ❌ Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
