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
    
    // Validate token
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

    // Token length validation
    console.log("Provider token length:", provider_token.length);
    if (provider_token.length < 100) {
      console.error("Token too short - likely invalid");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid Google token. Please re-authenticate with Google.",
          reviews: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use SERVICE_ROLE for database operations to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Also create client for user auth check
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

    // First, get all accounts for this user
    console.log("Fetching Google Business accounts...");
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
      
      if (accountsResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Google token expired. Please sign out and sign in again.",
            reviews: [] 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (accountsResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Missing Google Business permissions. Make sure you granted 'business.manage' scope.",
            reviews: [] 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Google API error: ${accountsResponse.status}`,
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
          message: "No Google Business accounts found. Make sure you have access to at least one business.",
          reviews: [],
          synced_count: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all businesses from database to match with Google locations
    let businessQuery = supabaseAdmin
      .from("businesses")
      .select("id, name, google_place_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (business_id) {
      businessQuery = businessQuery.eq("id", business_id);
    }

    const { data: dbBusinesses, error: businessError } = await businessQuery;
    if (businessError) {
      console.error("Error fetching businesses from DB:", businessError);
    }

    // Create a map for quick lookup
    const businessMap = new Map<string, string>();
    (dbBusinesses || []).forEach(b => {
      if (b.google_place_id) {
        businessMap.set(b.google_place_id, b.id);
      }
    });

    console.log("Business map:", Object.fromEntries(businessMap));

    const allReviews: any[] = [];
    const errors: string[] = [];

    // For each account, fetch locations and their reviews
    for (const account of accounts) {
      const accountName = account.name; // format: accounts/123456789
      const accountId = accountName.split("/")[1];
      console.log(`Processing account: ${accountName} (ID: ${accountId})`);

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
          errors.push(`Account ${accountId}: Failed to fetch locations (${locationsResponse.status})`);
          continue;
        }

        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];
        
        console.log(`Found ${locations.length} locations for ${accountName}`);

        // Fetch reviews for each location
        for (const location of locations) {
          const locationName = location.name; // format: locations/123456789
          const locationId = locationName.split("/")[1];
          const locationTitle = location.title || "Unknown Location";
          
          console.log(`Fetching reviews for ${locationTitle} (Location ID: ${locationId})`);

          // Find matching business in our database
          const matchedBusinessId = businessMap.get(locationId);
          console.log(`Matched business_id: ${matchedBusinessId || "NOT FOUND"}`);

          try {
            // CORRECT API ENDPOINT: accounts/{accountId}/locations/{locationId}/reviews
            // Use pagination to fetch ALL reviews (Google returns max 50 per page)
            let nextPageToken: string | null = null;
            let pageCount = 0;
            const MAX_PAGES = 10; // Safety limit to prevent infinite loops
            
            do {
              pageCount++;
              let reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`;
              if (nextPageToken) {
                reviewsUrl += `&pageToken=${encodeURIComponent(nextPageToken)}`;
              }
              
              console.log(`Calling (page ${pageCount}): ${reviewsUrl}`);
              
              const reviewsResponse = await fetch(reviewsUrl, {
                headers: {
                  Authorization: `Bearer ${provider_token}`,
                },
              });

              if (!reviewsResponse.ok) {
                const errorText = await reviewsResponse.text();
                console.error(`Failed to fetch reviews for ${locationTitle}:`, reviewsResponse.status, errorText);
                
                // Parse error for better messages
                let parsedError: any = {};
                try {
                  parsedError = JSON.parse(errorText);
                } catch {}
                
                const isServiceDisabled = parsedError?.error?.status === "PERMISSION_DENIED" && 
                  (errorText.includes("SERVICE_DISABLED") || errorText.includes("mybusiness.googleapis.com"));
                
                if (reviewsResponse.status === 429) {
                  errors.push(`${locationTitle}: Quota exceeded - try again later`);
                } else if (reviewsResponse.status === 403 && isServiceDisabled) {
                  errors.push(`API_DISABLED: Google My Business API is disabled. Enable it in Google Cloud Console and reconnect.`);
                } else if (reviewsResponse.status === 403) {
                  errors.push(`${locationTitle}: Access denied - reconnect Google with correct permissions`);
                } else if (reviewsResponse.status === 404) {
                  errors.push(`${locationTitle}: No reviews endpoint (might be a new listing)`);
                } else {
                  errors.push(`${locationTitle}: Error ${reviewsResponse.status}`);
                }
                break; // Exit pagination loop on error
              }

              const reviewsData = await reviewsResponse.json();
              const reviews = reviewsData.reviews || [];
              nextPageToken = reviewsData.nextPageToken || null;
              
              console.log(`Found ${reviews.length} reviews on page ${pageCount} for ${locationTitle}${nextPageToken ? ' (more pages available)' : ''}`);

              // Process and save each review
              for (const review of reviews) {
                // Use review.name as the full ID, but extract the unique review part
                // Format: accounts/xxx/locations/xxx/reviews/UNIQUE_REVIEW_ID
                const fullReviewId = review.name || review.reviewId;
                
                if (!fullReviewId) {
                  console.error("Review has no ID:", review);
                  continue;
                }

                // Extract the unique review ID (the last part after /reviews/)
                const reviewIdParts = fullReviewId.split("/reviews/");
                const uniqueReviewId = reviewIdParts.length > 1 ? reviewIdParts[1] : fullReviewId;
                
                // Create a canonical review_id without the account prefix to avoid duplicates
                // Use format: locations/{locationId}/reviews/{uniqueReviewId}
                const canonicalReviewId = `locations/${locationId}/reviews/${uniqueReviewId}`;

                // Convert star rating
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
                  user_id: user.id,
                  review_id: canonicalReviewId,
                  location_id: locationId,
                  author: review.reviewer?.displayName || "Anonyme",
                  rating: rating,
                  comment: review.comment || "",
                  review_date: review.createTime || new Date().toISOString(),
                  replied: !!review.reviewReply,
                  // Store existing Google replies in google_reply, NOT ai_response
                  google_reply: review.reviewReply?.comment || null,
                };

                console.log(`Processing review: ${canonicalReviewId} from ${reviewData.author} (${rating} stars)`);

                // Check for existing review by canonical review_id OR by user_id + location_id + unique part
                const { data: existingReview } = await supabaseAdmin
                  .from("reviews")
                  .select("id")
                  .eq("user_id", user.id)
                  .eq("review_id", canonicalReviewId)
                  .maybeSingle();

                let result;
                if (existingReview) {
                  console.log(`Updating existing review ${existingReview.id}`);
                  // Update google_reply but NEVER overwrite ai_response (which is our AI-generated content)
                  result = await supabaseAdmin
                    .from("reviews")
                    .update({
                      author: reviewData.author,
                      rating: reviewData.rating,
                      comment: reviewData.comment,
                      replied: reviewData.replied,
                      google_reply: reviewData.google_reply,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingReview.id)
                    .select()
                    .single();
                } else {
                  console.log(`Inserting new review`);
                  result = await supabaseAdmin
                    .from("reviews")
                    .insert(reviewData)
                    .select()
                    .single();
                }

                if (result.data) {
                  allReviews.push(result.data);
                } else if (result.error) {
                  console.error("Error saving review:", result.error);
                  errors.push(`Failed to save review from ${reviewData.author}: ${result.error.message}`);
                }
              }
            } while (nextPageToken && pageCount < MAX_PAGES);
            
            if (pageCount >= MAX_PAGES && nextPageToken) {
              console.warn(`Reached max page limit (${MAX_PAGES}) for ${locationTitle}, some reviews may not be synced`);
            }
          } catch (error) {
            console.error(`Error fetching reviews for ${locationTitle}:`, error);
            errors.push(`${locationTitle}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      } catch (error) {
        console.error(`Error processing account ${accountName}:`, error);
        errors.push(`Account ${accountId}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Determine if this is a real success or failure
    const hasApiDisabledError = errors.some(e => e.startsWith("API_DISABLED:"));
    const isSuccess = allReviews.length > 0 || (errors.length === 0);
    
    let message: string;
    if (hasApiDisabledError) {
      message = "Google My Business API désactivée. Activez-la dans Google Cloud Console puis reconnectez-vous.";
    } else if (errors.length > 0 && allReviews.length === 0) {
      message = `Échec de la synchronisation: ${errors.length} erreur(s)`;
    } else if (errors.length > 0) {
      message = `${allReviews.length} avis synchronisés avec ${errors.length} erreur(s)`;
    } else if (allReviews.length === 0) {
      message = "Aucun nouvel avis à synchroniser";
    } else {
      message = `${allReviews.length} avis synchronisés avec succès`;
    }

    console.log(message);
    if (errors.length > 0) {
      console.log("Errors:", errors);
    }

    return new Response(
      JSON.stringify({ 
        success: isSuccess, 
        message,
        reviews: allReviews,
        synced_count: allReviews.length,
        errors: errors.length > 0 ? errors : undefined,
        requires_reconnect: hasApiDisabledError
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
