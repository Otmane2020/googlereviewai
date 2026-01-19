import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfileTokens {
  google_refresh_token: string | null;
  google_access_token: string | null;
  google_token_expires_at: string | null;
}

// Helper function to refresh Google access token
async function refreshGoogleToken(
  supabase: any,
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  // Get current tokens
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("google_refresh_token, google_access_token, google_token_expires_at")
    .eq("id", userId)
    .single() as { data: ProfileTokens | null; error: any };

  if (profileError || !profile?.google_refresh_token) {
    console.log(`No refresh token for user ${userId}`);
    return null;
  }

  // Check if current token is still valid (with 5 min buffer)
  if (profile.google_token_expires_at && profile.google_access_token) {
    const expiresAt = new Date(profile.google_token_expires_at);
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (expiresAt.getTime() - bufferTime > Date.now()) {
      console.log(`Token still valid for user ${userId}`);
      return profile.google_access_token;
    }
  }

  console.log(`Refreshing token for user ${userId}`);

  // Refresh the token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error(`Token refresh failed for user ${userId}:`, tokenData);
    
    // If token was revoked, clear it
    if (tokenData.error === "invalid_grant") {
      await supabase
        .from("profiles")
        .update({
          google_refresh_token: null,
          google_access_token: null,
          google_token_expires_at: null,
        })
        .eq("id", userId);
    }
    return null;
  }

  const { access_token, expires_in } = tokenData;
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  // Store new token
  await supabase
    .from("profiles")
    .update({
      google_access_token: access_token,
      google_token_expires_at: expiresAt,
    })
    .eq("id", userId);

  return access_token;
}

// Helper function to sync reviews for a single business
async function syncBusinessReviews(
  accessToken: string,
  locationId: string,
  userId: string,
  supabase: any
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Fetch reviews from Google
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationId}/reviews`;
    const response = await fetch(reviewsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch reviews for ${locationId}:`, errorText);
      errors.push(`Location ${locationId}: ${response.status}`);
      return { synced, errors };
    }

    const data = await response.json();
    const reviews = data.reviews || [];

    for (const review of reviews) {
      const reviewId = review.reviewId || review.name?.split("/").pop();
      const reviewer = review.reviewer || {};
      
      const reviewData = {
        review_id: reviewId,
        user_id: userId,
        location_id: locationId,
        author: reviewer.displayName || "Anonyme",
        rating: review.starRating ? parseInt(review.starRating.replace("STAR_", "").replace("_", "")) || 5 : 5,
        comment: review.comment || null,
        review_date: review.createTime || new Date().toISOString(),
      };

      // Upsert review
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
      }
    }
  } catch (error) {
    console.error(`Exception syncing ${locationId}:`, error);
    errors.push(`Location ${locationId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { synced, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting autonomous cron sync reviews job...");

    // Check if OAuth is configured
    if (!clientId || !clientSecret) {
      console.log("Google OAuth not configured - skipping autonomous sync");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Google OAuth credentials not configured",
          synced: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all users with auto_sync_reviews enabled AND a refresh token
    const { data: settings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("user_id, auto_sync_reviews, auto_publish_to_google, minimum_rating")
      .eq("auto_sync_reviews", true);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw new Error("Failed to fetch AI settings");
    }

    if (!settings || settings.length === 0) {
      console.log("No users with auto-sync enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No users to sync", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${settings.length} users with auto-sync enabled`);

    let totalSynced = 0;
    let totalNewReviews = 0;
    let usersProcessed = 0;
    let usersSkipped = 0;
    const errors: string[] = [];

    for (const userSettings of settings) {
      try {
        // Get user profile to check for refresh token
        const { data: profile } = await supabase
          .from("profiles")
          .select("google_refresh_token")
          .eq("id", userSettings.user_id)
          .single();

        if (!profile?.google_refresh_token) {
          console.log(`User ${userSettings.user_id} has no refresh token - skipping`);
          usersSkipped++;
          continue;
        }

        // Refresh access token
        const accessToken = await refreshGoogleToken(
          supabase,
          userSettings.user_id,
          clientId,
          clientSecret
        );

        if (!accessToken) {
          console.log(`Could not get access token for user ${userSettings.user_id}`);
          usersSkipped++;
          continue;
        }

        // Get user's businesses
        const { data: businesses, error: businessError } = await supabase
          .from("businesses")
          .select("id, name, google_place_id")
          .eq("user_id", userSettings.user_id)
          .eq("is_active", true);

        if (businessError || !businesses || businesses.length === 0) {
          console.log(`No businesses for user ${userSettings.user_id}`);
          continue;
        }

        console.log(`Syncing ${businesses.length} businesses for user ${userSettings.user_id}`);

        // Get existing review IDs to detect new ones
        const { data: existingReviews } = await supabase
          .from("reviews")
          .select("review_id")
          .eq("user_id", userSettings.user_id);

        const existingReviewIds = new Set(existingReviews?.map(r => r.review_id) || []);

        // Sync each business
        for (const business of businesses) {
          if (!business.google_place_id) continue;

          const result = await syncBusinessReviews(
            accessToken,
            business.google_place_id,
            userSettings.user_id,
            supabase
          );

          totalSynced += result.synced;
          errors.push(...result.errors);
        }

        // Check for new reviews that need notifications
        const { data: newReviews } = await supabase
          .from("reviews")
          .select("*")
          .eq("user_id", userSettings.user_id)
          .is("ai_response", null)
          .gte("rating", userSettings.minimum_rating || 1);

        if (newReviews) {
          for (const review of newReviews) {
            if (!existingReviewIds.has(review.review_id)) {
              totalNewReviews++;
              
              // Create notification for new review
              await supabase
                .from("notifications")
                .insert({
                  user_id: userSettings.user_id,
                  type: "new_review",
                  title: "Nouvel avis reçu",
                  message: `${review.author} a laissé un avis ${review.rating} étoile${review.rating > 1 ? 's' : ''}.`,
                  review_id: review.id,
                });
            }
          }
        }

        usersProcessed++;
      } catch (userError) {
        console.error(`Error processing user ${userSettings.user_id}:`, userError);
        errors.push(`User ${userSettings.user_id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
      }
    }

    const message = `Autonomous sync completed. Processed ${usersProcessed} users (${usersSkipped} skipped), synced ${totalSynced} reviews, ${totalNewReviews} new reviews detected.`;
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
    console.error("Cron sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
