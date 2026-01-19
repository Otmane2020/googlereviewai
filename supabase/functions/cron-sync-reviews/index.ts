import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      try {
        // Get access token using shared helper (SERVICE_ROLE client)
        const tokenResult = await getGoogleAccessToken(supabase, userSettings.user_id);

        if (!tokenResult.token) {
          console.log(`[CRON] User ${userSettings.user_id}: ${tokenResult.error || 'No token'}`);
          usersSkipped++;
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

              // Send email notification if enabled
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", userSettings.user_id)
                .single();

              const { data: emailSettings } = await supabase
                .from("ai_settings")
                .select("email_notifications")
                .eq("user_id", userSettings.user_id)
                .single();

              if (userProfile?.email && emailSettings?.email_notifications !== false) {
                try {
                  await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                      to: userProfile.email,
                      subject: `Nouvel avis ${review.rating}⭐ de ${review.author}`,
                      html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                          <h2 style="color: #333;">Nouvel avis reçu</h2>
                          <p><strong>${review.author}</strong> a laissé un avis ${review.rating} étoile${review.rating > 1 ? 's' : ''}.</p>
                          ${review.comment ? `<blockquote style="border-left: 3px solid #ddd; padding-left: 12px; color: #666;">${review.comment}</blockquote>` : ''}
                          <p><a href="https://starlinko.lovable.app/reviews" style="color: #2563eb;">Voir et répondre à l'avis</a></p>
                          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                          <p style="color: #888; font-size: 12px;">Starlinko - Gérez vos avis Google en automatique</p>
                        </div>
                      `,
                    }),
                  });
                } catch (emailError) {
                  console.error("[CRON] Failed to send email notification:", emailError);
                }
              }

              // Send Web Push notification
              try {
                await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    user_id: userSettings.user_id,
                    title: `Nouvel avis ${review.rating}⭐`,
                    body: `${review.author} a laissé un avis${review.comment ? ': "' + review.comment.substring(0, 50) + '..."' : '.'}`,
                    url: "/reviews",
                    data: { review_id: review.id },
                  }),
                });
              } catch (pushError) {
                console.error("[CRON] Failed to send push notification:", pushError);
              }
            }
          }
        }

        usersProcessed++;
      } catch (userError) {
        console.error(`[CRON] Error processing user ${userSettings.user_id}:`, userError);
        errors.push(`User ${userSettings.user_id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
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
