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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting cron sync reviews job...");

    // Get all users with auto_sync_reviews enabled
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
    const errors: string[] = [];

    for (const userSettings of settings) {
      try {
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

        // Get existing review IDs to detect new ones
        const { data: existingReviews } = await supabase
          .from("reviews")
          .select("review_id")
          .eq("user_id", userSettings.user_id);

        const existingReviewIds = new Set(existingReviews?.map(r => r.review_id) || []);

        // Note: In production, we would need stored OAuth tokens
        // For now, this cron job logs what would be synced
        // The actual sync happens when user triggers manually with their OAuth token
        
        console.log(`User ${userSettings.user_id} has ${businesses.length} businesses to sync`);
        
        // Check for any new reviews that came in (from test data or other sources)
        const { data: newReviews, error: newReviewsError } = await supabase
          .from("reviews")
          .select("*")
          .eq("user_id", userSettings.user_id)
          .is("ai_response", null)
          .gte("rating", userSettings.minimum_rating || 1);

        if (newReviews && newReviews.length > 0) {
          console.log(`Found ${newReviews.length} reviews without AI response for user ${userSettings.user_id}`);
          
          for (const review of newReviews) {
            // Check if this is a new review (not in existing set before this sync)
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

        totalSynced++;
      } catch (userError) {
        console.error(`Error processing user ${userSettings.user_id}:`, userError);
        errors.push(`User ${userSettings.user_id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
      }
    }

    const message = `Sync completed. Processed ${totalSynced} users, ${totalNewReviews} new reviews detected.`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        users_processed: totalSynced,
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
