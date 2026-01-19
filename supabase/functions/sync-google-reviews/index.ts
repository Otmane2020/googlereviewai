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

    // First, get all accounts for this user using the Business Profile API
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${provider_token}`,
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("Failed to fetch accounts:", accountsResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to fetch Google Business accounts. Make sure you have Business Profile API access.",
          error: errorText,
          reviews: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    console.log(`Found ${accounts.length} Google Business accounts`);

    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No Google Business accounts found",
          reviews: [],
          synced_count: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch businesses to get location IDs from database
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

    const allReviews: any[] = [];
    const errors: string[] = [];

    // For each account, fetch locations and their reviews
    for (const account of accounts) {
      const accountName = account.name; // format: accounts/123456789
      console.log(`Processing account: ${accountName}`);

      try {
        // Get locations for this account
        const locationsResponse = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`,
          {
            headers: {
              Authorization: `Bearer ${provider_token}`,
            },
          }
        );

        if (!locationsResponse.ok) {
          const errorText = await locationsResponse.text();
          console.error(`Failed to fetch locations for ${accountName}:`, locationsResponse.status, errorText);
          continue;
        }

        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];
        
        console.log(`Found ${locations.length} locations for ${accountName}`);

        // Fetch reviews for each location
        for (const location of locations) {
          const locationName = location.name; // format: locations/123456789
          const locationTitle = location.title || "Unknown Location";
          
          // Extract location ID for matching with database
          const locationId = locationName.replace("locations/", "");
          
          console.log(`Fetching reviews for ${locationTitle} (${locationName})`);

          try {
            // Use the correct API endpoint for reviews
            const reviewsResponse = await fetch(
              `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews`,
              {
                headers: {
                  Authorization: `Bearer ${provider_token}`,
                },
              }
            );

            if (!reviewsResponse.ok) {
              const errorText = await reviewsResponse.text();
              console.error(`Failed to fetch reviews for ${locationTitle}:`, reviewsResponse.status, errorText);
              
              if (reviewsResponse.status === 429) {
                errors.push(`${locationTitle}: Quota exceeded`);
              } else if (reviewsResponse.status === 403) {
                errors.push(`${locationTitle}: Access denied - check API permissions`);
              } else if (reviewsResponse.status === 404) {
                // Try alternate API endpoint
                console.log(`Trying alternate endpoint for ${locationTitle}`);
                const altReviewsResponse = await fetch(
                  `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
                  {
                    headers: {
                      Authorization: `Bearer ${provider_token}`,
                    },
                  }
                );
                
                if (altReviewsResponse.ok) {
                  const altReviewsData = await altReviewsResponse.json();
                  const reviews = altReviewsData.reviews || [];
                  console.log(`Found ${reviews.length} reviews via alternate endpoint`);
                  
                  // Process reviews
                  for (const review of reviews) {
                    await processReview(supabaseClient, user.id, locationId, review, allReviews);
                  }
                } else {
                  errors.push(`${locationTitle}: Location not found`);
                }
              } else {
                errors.push(`${locationTitle}: Error ${reviewsResponse.status}`);
              }
              continue;
            }

            const reviewsData = await reviewsResponse.json();
            const reviews = reviewsData.reviews || [];
            
            console.log(`Found ${reviews.length} reviews for ${locationTitle}`);

            // Process and save each review
            for (const review of reviews) {
              await processReview(supabaseClient, user.id, locationId, review, allReviews);
            }
          } catch (error) {
            console.error(`Error fetching reviews for ${locationTitle}:`, error);
            errors.push(`${locationTitle}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      } catch (error) {
        console.error(`Error processing account ${accountName}:`, error);
        errors.push(`Account ${accountName}: ${error instanceof Error ? error.message : "Unknown error"}`);
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

async function processReview(
  supabaseClient: any, 
  userId: string, 
  locationId: string, 
  review: any,
  allReviews: any[]
) {
  // Convert star rating format
  const starMapping: Record<string, number> = {
    "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5,
    "STAR_RATING_UNSPECIFIED": 0
  };
  
  let rating = 5;
  if (typeof review.starRating === "string") {
    rating = starMapping[review.starRating] || 5;
  } else if (typeof review.starRating === "number") {
    rating = review.starRating;
  }

  const reviewData = {
    user_id: userId,
    review_id: review.reviewId || review.name,
    location_id: locationId,
    author: review.reviewer?.displayName || "Anonyme",
    rating: rating,
    comment: review.comment || "",
    review_date: review.createTime || new Date().toISOString(),
    replied: !!review.reviewReply,
    ai_response: review.reviewReply?.comment || null,
  };

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
