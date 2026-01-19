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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { provider_token, business_id } = await req.json();
    
    if (!provider_token) {
      console.log("No provider token provided");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No Google access token. Please sign out and sign in again with Google.",
          reviews: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("User authenticated:", user.id);

    // Fetch businesses to get location IDs
    let businessQuery = supabaseClient
      .from("businesses")
      .select("id, name, google_place_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Filter by specific business if provided
    if (business_id) {
      businessQuery = businessQuery.eq("id", business_id);
    }

    const { data: businesses, error: businessError } = await businessQuery;

    if (businessError) {
      console.error("Error fetching businesses:", businessError);
      throw new Error("Failed to fetch businesses");
    }

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No businesses found to sync reviews",
          reviews: [],
          synced_count: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${businesses.length} businesses to sync reviews for`);

    const allReviews: any[] = [];
    const errors: string[] = [];

    // Fetch reviews for each business/location
    for (const business of businesses) {
      if (!business.google_place_id) {
        console.log(`Skipping business ${business.name}: no google_place_id`);
        continue;
      }

      const locationName = `locations/${business.google_place_id}`;
      console.log(`Fetching reviews for ${locationName}`);

      try {
        const reviewsResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
          {
            headers: {
              Authorization: `Bearer ${provider_token}`,
            },
          }
        );

        if (!reviewsResponse.ok) {
          const errorText = await reviewsResponse.text();
          console.error(`Failed to fetch reviews for ${business.name}:`, reviewsResponse.status, errorText);
          
          if (reviewsResponse.status === 429) {
            errors.push(`${business.name}: Quota exceeded`);
          } else if (reviewsResponse.status === 403) {
            errors.push(`${business.name}: Access denied`);
          } else {
            errors.push(`${business.name}: ${reviewsResponse.status}`);
          }
          continue;
        }

        const reviewsData = await reviewsResponse.json();
        const reviews = reviewsData.reviews || [];
        
        console.log(`Found ${reviews.length} reviews for ${business.name}`);

        // Process and save each review
        for (const review of reviews) {
          const reviewData = {
            user_id: user.id,
            review_id: review.reviewId || review.name,
            location_id: business.google_place_id,
            author: review.reviewer?.displayName || "Anonyme",
            rating: parseInt(review.starRating?.replace("STAR_RATING_", "") || review.starRating) || 5,
            comment: review.comment || "",
            review_date: review.createTime || new Date().toISOString(),
            replied: !!review.reviewReply,
            ai_response: review.reviewReply?.comment || null,
          };

          // Convert star rating format (ONE, TWO, THREE, etc. to numbers)
          const starMapping: Record<string, number> = {
            "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5
          };
          if (typeof review.starRating === "string" && starMapping[review.starRating]) {
            reviewData.rating = starMapping[review.starRating];
          }

          // Upsert review
          const { data: existingReview } = await supabaseClient
            .from("reviews")
            .select("id")
            .eq("review_id", reviewData.review_id)
            .maybeSingle();

          let result;
          if (existingReview) {
            result = await supabaseClient
              .from("reviews")
              .update({
                author: reviewData.author,
                rating: reviewData.rating,
                comment: reviewData.comment,
                replied: reviewData.replied,
                ai_response: reviewData.ai_response,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingReview.id)
              .select()
              .single();
          } else {
            result = await supabaseClient
              .from("reviews")
              .insert(reviewData)
              .select()
              .single();
          }

          if (result.data) {
            allReviews.push(result.data);
          } else if (result.error) {
            console.error("Error saving review:", result.error);
          }
        }
      } catch (error) {
        console.error(`Error processing reviews for ${business.name}:`, error);
        errors.push(`${business.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    const message = errors.length > 0 
      ? `Synced ${allReviews.length} reviews with ${errors.length} errors`
      : `Successfully synced ${allReviews.length} reviews`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        reviews: allReviews,
        synced_count: allReviews.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error syncing reviews:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        reviews: [],
        synced_count: 0
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
