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

// Fetch locations with FULL business info (website, description, address, phone, categories, etc.)
async function fetchGMBLocations(accessToken: string, accountName: string): Promise<{ locations: any[]; error?: string }> {
  try {
    // Extended readMask to get all business info
    const readMask = [
      "name",
      "title",
      "storefrontAddress",
      "websiteUri",
      "regularHours",
      "phoneNumbers",
      "categories",
      "profile",
      "metadata",
    ].join(",");

    const response = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${readMask}`,
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

// Update business info from GMB location data
async function updateBusinessInfo(
  supabase: any,
  businessId: string,
  location: any
): Promise<void> {
  try {
    const updateData: Record<string, any> = {};

    // Website URL
    if (location.websiteUri) {
      updateData.website = location.websiteUri;
    }

    // Phone number (primary)
    if (location.phoneNumbers?.primaryPhone) {
      updateData.phone = location.phoneNumbers.primaryPhone;
    }

    // Address
    if (location.storefrontAddress) {
      const addr = location.storefrontAddress;
      const addressParts = [
        addr.addressLines?.join(", "),
        addr.locality,
        addr.postalCode,
        addr.regionCode
      ].filter(Boolean);
      if (addressParts.length > 0) {
        updateData.address = addressParts.join(", ");
      }
    }

    // Categories
    if (location.categories) {
      const categories: string[] = [];
      if (location.categories.primaryCategory?.displayName) {
        categories.push(location.categories.primaryCategory.displayName);
      }
      if (location.categories.additionalCategories) {
        for (const cat of location.categories.additionalCategories) {
          if (cat.displayName) categories.push(cat.displayName);
        }
      }
      if (categories.length > 0) {
        updateData.categories = categories;
      }
    }

    // Description from profile
    if (location.profile?.description) {
      updateData.description = location.profile.description;
    }

    // Maps URL from metadata
    if (location.metadata?.mapsUri) {
      updateData.maps_url = location.metadata.mapsUri;
    }

    // Profile image from metadata
    if (location.metadata?.newReviewUri) {
      // The newReviewUri contains the place ID, we can build a photos URL
      // But for profile image, we'd need a separate API call
    }

    // Only update if we have data
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from("businesses")
        .update(updateData)
        .eq("id", businessId);

      if (error) {
        console.error(`[CRON] Failed to update business ${businessId}:`, error);
      } else {
        console.log(`[CRON] 📝 Updated business info: ${Object.keys(updateData).join(", ")}`);
      }
    }
  } catch (error) {
    console.error(`[CRON] Exception updating business info:`, error);
  }
}

// Sync reviews for a specific location WITH PAGINATION + DELETION DETECTION
const MAX_PAGES = 10;

async function syncLocationReviews(
  accessToken: string,
  accountId: string,
  locationId: string,
  userId: string,
  supabase: any
): Promise<{ synced: number; newReviewIds: string[]; deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  let deleted = 0;
  const newReviewIds: string[] = [];
  const allGoogleReviewIds: string[] = []; // Track ALL reviews from Google

  try {
    // Get existing review IDs for this location BEFORE sync
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("id, review_id")
      .eq("user_id", userId)
      .eq("location_id", locationId);
    
    const existingReviewIds = new Set(existingReviews?.map((r: any) => r.review_id) || []);
    console.log(`[CRON] Location ${locationId}: ${existingReviewIds.size} existing reviews in DB`);

    // PAGINATION LOOP - fetch ALL pages
    let nextPageToken: string | null = null;
    let pageCount = 0;

    do {
      pageCount++;
      let reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`;
      if (nextPageToken) {
        reviewsUrl += `&pageToken=${encodeURIComponent(nextPageToken)}`;
      }
      
      console.log(`[CRON] Fetching page ${pageCount}...`);
      
      const response = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[CRON] Failed to fetch reviews:`, response.status);
        
        if (response.status === 404) {
          errors.push(`Location ${locationId}: No reviews endpoint`);
        } else if (response.status === 403) {
          errors.push(`Location ${locationId}: Permission denied`);
        } else {
          errors.push(`Location ${locationId}: Error ${response.status}`);
        }
        break;
      }

      const data = await response.json();
      const reviews = data.reviews || [];
      nextPageToken = data.nextPageToken || null;
      
      console.log(`[CRON] Page ${pageCount}: ${reviews.length} reviews${nextPageToken ? ' (more pages)' : ''}`);

      // Batch process reviews
      const reviewsToUpsert: any[] = [];

      for (const review of reviews) {
        const fullReviewId = review.name || review.reviewId;
        if (!fullReviewId) continue;

        const reviewIdParts = fullReviewId.split("/reviews/");
        const uniqueReviewId = reviewIdParts.length > 1 ? reviewIdParts[1] : fullReviewId;
        const canonicalReviewId = `locations/${locationId}/reviews/${uniqueReviewId}`;

        // Track this review ID from Google
        allGoogleReviewIds.push(canonicalReviewId);

        const isNewReview = !existingReviewIds.has(canonicalReviewId);
        const rating = parseStarRating(review.starRating);

        reviewsToUpsert.push({
          review_id: canonicalReviewId,
          user_id: userId,
          location_id: locationId,
          author: review.reviewer?.displayName || "Anonyme",
          rating: rating,
          comment: review.comment || "",
          review_date: review.createTime || new Date().toISOString(),
          replied: !!review.reviewReply,
          google_reply: review.reviewReply?.comment || null,
          notified: !isNewReview, // New reviews need notification
        });

        if (isNewReview) {
          newReviewIds.push(canonicalReviewId);
          console.log(`[CRON] 🆕 NEW: ${review.reviewer?.displayName || 'Anonyme'} (${rating}⭐)`);
        }
      }

      // Batch upsert
      if (reviewsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from("reviews")
          .upsert(reviewsToUpsert, { 
            onConflict: "review_id,user_id",
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error(`[CRON] Batch upsert error:`, upsertError);
          errors.push(`Location ${locationId}: ${upsertError.message}`);
        } else {
          synced += reviewsToUpsert.length;
        }
      }
    } while (nextPageToken && pageCount < MAX_PAGES);

    if (pageCount >= MAX_PAGES && nextPageToken) {
      console.warn(`[CRON] ⚠️ Reached max pages (${MAX_PAGES})`);
    }

    // DELETION DETECTION: Remove reviews that no longer exist on Google
    if (allGoogleReviewIds.length > 0 && existingReviews && existingReviews.length > 0) {
      const googleReviewIdSet = new Set(allGoogleReviewIds);
      const reviewsToDelete = existingReviews.filter((r: any) => !googleReviewIdSet.has(r.review_id));
      
      if (reviewsToDelete.length > 0) {
        console.log(`[CRON] 🗑️ Found ${reviewsToDelete.length} deleted reviews to remove`);
        
        const idsToDelete = reviewsToDelete.map((r: any) => r.id);
        const { error: deleteError } = await supabase
          .from("reviews")
          .delete()
          .in("id", idsToDelete);
        
        if (deleteError) {
          console.error("[CRON] Error deleting old reviews:", deleteError);
          errors.push(`Failed to delete ${reviewsToDelete.length} removed reviews`);
        } else {
          deleted = reviewsToDelete.length;
          console.log(`[CRON] ✅ Deleted ${deleted} reviews that were removed from Google`);
        }
      }
    }

    console.log(`[CRON] Location ${locationId}: ${synced} synced, ${newReviewIds.length} NEW, ${deleted} deleted`);

  } catch (error) {
    console.error(`[CRON] Exception syncing location:`, error);
    errors.push(`Location ${locationId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { synced, newReviewIds, deleted, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[CRON] ========================================");
    console.log("[CRON] Starting autonomous sync (reviews + business info)...");
    console.log("[CRON] ========================================");

    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("user_id, auto_sync_reviews, auto_publish_to_google, minimum_rating")
      .eq("auto_sync_reviews", true);

    if (settingsError) {
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
    let totalDeleted = 0;
    let usersProcessed = 0;
    let usersSkipped = 0;
    const errors: string[] = [];

    for (const userSettings of settings) {
      let userSynced = 0;
      let userNewReviews = 0;
      let userDeleted = 0;
      const userErrors: string[] = [];

      try {
        const tokenResult = await getGoogleAccessToken(supabase, userSettings.user_id);

        if (!tokenResult.token) {
          console.log(`[CRON] User ${userSettings.user_id}: ${tokenResult.error || 'No token'}`);
          usersSkipped++;
          
          await supabase
            .from("ai_settings")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: "error",
              last_sync_error: tokenResult.error || "No refresh token",
            })
            .eq("user_id", userSettings.user_id);
          continue;
        }

        const accessToken = tokenResult.token;
        console.log(`[CRON] ✅ Token OK for user ${userSettings.user_id}`);

        // Fetch GMB accounts
        const { accounts, error: accountsError } = await fetchGMBAccounts(accessToken);
        
        if (accountsError || accounts.length === 0) {
          userErrors.push(accountsError || "No GMB accounts");
          await supabase
            .from("ai_settings")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: "error",
              last_sync_error: accountsError || "No GMB accounts",
            })
            .eq("user_id", userSettings.user_id);
          continue;
        }

        // Get user's saved businesses with their IDs
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, name, google_place_id")
          .eq("user_id", userSettings.user_id)
          .eq("is_active", true);

        // Map google_place_id -> business.id for updates
        const businessIdMap = new Map<string, string>();
        (businesses || []).forEach((b: any) => {
          if (b.google_place_id) {
            businessIdMap.set(b.google_place_id, b.id);
          }
        });

        console.log(`[CRON] User has ${businessIdMap.size} active businesses`);

        // Process each account
        for (const account of accounts) {
          const accountName = account.name;
          const accountId = accountName.split("/")[1];

          // Fetch locations WITH FULL BUSINESS INFO
          const { locations, error: locationsError } = await fetchGMBLocations(accessToken, accountName);
          
          if (locationsError) {
            userErrors.push(`Account ${accountId}: ${locationsError}`);
            continue;
          }

          console.log(`[CRON] Account ${accountId}: ${locations.length} locations`);

          for (const location of locations) {
            const locationName = location.name;
            const locationId = locationName.split("/")[1];
            const businessId = businessIdMap.get(locationId);

            if (!businessId) {
              continue; // Not in user's saved businesses
            }

            console.log(`[CRON] 📍 Processing: ${location.title || locationId}`);

            // Update business info from GMB (website, description, etc.)
            await updateBusinessInfo(supabase, businessId, location);

            // Sync reviews
            const result = await syncLocationReviews(
              accessToken,
              accountId,
              locationId,
              userSettings.user_id,
              supabase
            );

            userSynced += result.synced;
            userNewReviews += result.newReviewIds.length;
            userDeleted += result.deleted;
            userErrors.push(...result.errors);
          }
        }

        totalSynced += userSynced;
        totalNewReviews += userNewReviews;
        totalDeleted += userDeleted;
        errors.push(...userErrors);

        // Update sync status
        await supabase
          .from("ai_settings")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: userErrors.length > 0 ? "partial" : "success",
            last_sync_error: userErrors.length > 0 ? userErrors.join("; ") : null,
            reviews_synced_count: userSynced,
          })
          .eq("user_id", userSettings.user_id);

        console.log(`[CRON] User done: ${userSynced} synced, ${userNewReviews} NEW, ${userDeleted} deleted`);
        usersProcessed++;

      } catch (userError) {
        console.error(`[CRON] Error processing user:`, userError);
        const errorMsg = userError instanceof Error ? userError.message : 'Unknown error';
        errors.push(`User ${userSettings.user_id}: ${errorMsg}`);
        
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

    // Trigger auto-respond for new reviews
    if (totalNewReviews > 0) {
      try {
        console.log(`[CRON] 🚀 Triggering auto-respond for ${totalNewReviews} new reviews...`);
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

    const message = `${usersProcessed} users, ${totalSynced} reviews synced, ${totalNewReviews} NEW, ${totalDeleted} deleted`;
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
        deleted_reviews: totalDeleted,
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
