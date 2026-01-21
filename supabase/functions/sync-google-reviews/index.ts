import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

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

    const { business_id } = await req.json();

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

    // Get access token using shared helper
    const tokenResult = await getGoogleAccessToken(supabaseAdmin, user.id);
    
    if (!tokenResult.token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: tokenResult.requires_reconnect 
            ? "Reconnectez votre compte Google Business pour synchroniser les avis."
            : (tokenResult.error || "Impossible d'obtenir un token Google valide."),
          reviews: [],
          synced_count: 0,
          requires_reconnect: tokenResult.requires_reconnect
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenResult.token;

    // First, get all accounts for this user
    console.log("Fetching Google Business accounts...");
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("Failed to fetch accounts:", accountsResponse.status, errorText);
      
      const isUnauthorized = accountsResponse.status === 401;
      const requiresReconnect = isUnauthorized || tokenResult.requires_reconnect;
      
      if (isUnauthorized) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Session Google expirée. Reconnectez votre compte.",
            reviews: [],
            requires_reconnect: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (accountsResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Missing Google Business permissions. Make sure you granted 'business.manage' scope.",
            reviews: [],
            requires_reconnect: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Google API error: ${accountsResponse.status}`,
          error: errorText,
          reviews: [],
          requires_reconnect: requiresReconnect
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
    const allGoogleReviewIds: string[] = []; // Track all review IDs from Google
    const errors: string[] = [];
    let hasApiDisabledError = false;

    // For each account, fetch locations and their reviews
    for (const account of accounts) {
      const accountName = account.name;
      const accountId = accountName.split("/")[1];
      console.log(`Processing account: ${accountName} (ID: ${accountId})`);

      try {
        // Get locations for this account
        const locationsResponse = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
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
          const locationName = location.name;
          const locationId = locationName.split("/")[1];
          const locationTitle = location.title || "Unknown Location";
          
          console.log(`Fetching reviews for ${locationTitle} (Location ID: ${locationId})`);

          const matchedBusinessId = businessMap.get(locationId);
          console.log(`Matched business_id: ${matchedBusinessId || "NOT FOUND"}`);

          try {
            let nextPageToken: string | null = null;
            let pageCount = 0;
            const MAX_PAGES = 10;
            
            do {
              pageCount++;
              let reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`;
              if (nextPageToken) {
                reviewsUrl += `&pageToken=${encodeURIComponent(nextPageToken)}`;
              }
              
              console.log(`Calling (page ${pageCount}): ${reviewsUrl}`);
              
              const reviewsResponse = await fetch(reviewsUrl, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!reviewsResponse.ok) {
                const errorText = await reviewsResponse.text();
                console.error(`Failed to fetch reviews for ${locationTitle}:`, reviewsResponse.status, errorText);
                
                let parsedError: any = {};
                try {
                  parsedError = JSON.parse(errorText);
                } catch {}
                
                const isServiceDisabled = parsedError?.error?.status === "PERMISSION_DENIED" && 
                  (errorText.includes("SERVICE_DISABLED") || errorText.includes("mybusiness.googleapis.com"));
                
                if (isServiceDisabled) {
                  hasApiDisabledError = true;
                }
                
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
                break;
              }

              const reviewsData = await reviewsResponse.json();
              const reviews = reviewsData.reviews || [];
              nextPageToken = reviewsData.nextPageToken || null;
              
              console.log(`Found ${reviews.length} reviews on page ${pageCount} for ${locationTitle}${nextPageToken ? ' (more pages available)' : ''}`);

              // Batch process reviews for this page
              const reviewsToUpsert: any[] = [];
              const reviewIdsInPage: string[] = [];
              
              for (const review of reviews) {
                const fullReviewId = review.name || review.reviewId;
                
                if (!fullReviewId) {
                  console.error("Review has no ID:", review);
                  continue;
                }

                const reviewIdParts = fullReviewId.split("/reviews/");
                const uniqueReviewId = reviewIdParts.length > 1 ? reviewIdParts[1] : fullReviewId;
                const canonicalReviewId = `locations/${locationId}/reviews/${uniqueReviewId}`;

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

                reviewIdsInPage.push(canonicalReviewId);
                
                // Extract photos from review (media array from GMB API)
                const photos: string[] = [];
                if (review.reviewReply?.media) {
                  for (const media of review.reviewReply.media) {
                    if (media.googleUrl) photos.push(media.googleUrl);
                  }
                }
                // Also check for reviewer media (photos attached by the reviewer)
                if (review.reviewer?.profilePhotoUrl) {
                  // This is the reviewer's profile photo, not review photos
                }
                // GMB API stores review media in a different field
                if (review.media) {
                  for (const media of review.media) {
                    if (media.googleUrl) photos.push(media.googleUrl);
                    else if (media.thumbnailUrl) photos.push(media.thumbnailUrl);
                  }
                }
                
                // Extract criteria/aspects (for hotels, restaurants, etc.)
                // GMB API provides these as reviewReply.reviewReplyMetrics or in the review itself
                let criteria: Record<string, number> | null = null;
                if (review.reviewRating) {
                  // Some categories have specific rating aspects
                  criteria = {};
                  // Common aspects from GMB: rooms, service, location, cleanliness, food, etc.
                  for (const [key, value] of Object.entries(review.reviewRating)) {
                    if (key !== 'overallRating' && typeof value === 'string') {
                      const aspectRating = { "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5 }[value as string];
                      if (aspectRating) {
                        criteria[key] = aspectRating;
                      }
                    }
                  }
                  if (Object.keys(criteria).length === 0) criteria = null;
                }
                
                // For existing reviews, we preserve notified status by setting it to true
                // This prevents re-triggering notifications for old reviews
                reviewsToUpsert.push({
                  user_id: user.id,
                  review_id: canonicalReviewId,
                  location_id: locationId,
                  author: review.reviewer?.displayName || "Anonyme",
                  rating: rating,
                  comment: review.comment || "",
                  review_date: review.createTime || new Date().toISOString(),
                  replied: !!review.reviewReply,
                  google_reply: review.reviewReply?.comment || null,
                  photos: photos.length > 0 ? photos : [],
                  criteria: criteria,
                });
                
                // Track this review ID from Google
                allGoogleReviewIds.push(canonicalReviewId);
              }
              
              // Check which reviews already exist in DB and detect edits
              if (reviewsToUpsert.length > 0) {
                const { data: existingReviews } = await supabaseAdmin
                  .from("reviews")
                  .select("id, review_id, comment, ai_response")
                  .eq("user_id", user.id)
                  .in("review_id", reviewIdsInPage);
                
                const existingReviewMap = new Map((existingReviews || []).map(r => [r.review_id, r]));
                
                // For existing reviews, mark as notified and detect edits
                // For new reviews, let the trigger handle notification (notified will be false/null)
                const reviewsWithNotified = reviewsToUpsert.map(r => {
                  const existing = existingReviewMap.get(r.review_id);
                  if (existing) {
                    // Check if comment was edited
                    const wasEdited = existing.comment !== r.comment && r.comment !== "";
                    if (wasEdited) {
                      console.log(`[Sync] Review ${r.review_id} was edited by customer`);
                      return {
                        ...r,
                        notified: true,
                        last_edited_at: new Date().toISOString(),
                        edit_count: (existing as any).edit_count ? (existing as any).edit_count + 1 : 1,
                        needs_new_response: existing.ai_response ? true : false, // Flag for re-generation
                      };
                    }
                    return { ...r, notified: true };
                  }
                  return { ...r, notified: false };
                });
                
                // Count edited reviews for notification
                const editedReviews = reviewsWithNotified.filter((r: any) => r.needs_new_response);
                
                console.log(`Batch upserting ${reviewsWithNotified.length} reviews (${existingReviewMap.size} existing, ${reviewsWithNotified.length - existingReviewMap.size} new, ${editedReviews.length} edited) for ${locationTitle}`);
                
                const { data: upsertedReviews, error: upsertError } = await supabaseAdmin
                  .from("reviews")
                  .upsert(reviewsWithNotified, { 
                    onConflict: "review_id,user_id",
                    ignoreDuplicates: false 
                  })
                  .select();
                
                if (upsertError) {
                  console.error("Batch upsert error:", upsertError);
                  errors.push(`${locationTitle}: ${upsertError.message}`);
                } else if (upsertedReviews) {
                  allReviews.push(...upsertedReviews);
                  
                  // Create notifications for edited reviews
                  for (const editedReview of editedReviews) {
                    await supabaseAdmin.from("notifications").insert({
                      user_id: user.id,
                      type: "review_edited",
                      title: "✏️ Avis modifié",
                      message: `${editedReview.author} a modifié son avis ${editedReview.rating} étoiles`,
                      review_id: upsertedReviews.find((r: any) => r.review_id === editedReview.review_id)?.id || null,
                    });
                  }
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

    // Delete reviews that no longer exist on Google
    let deletedCount = 0;
    if (allGoogleReviewIds.length > 0) {
      console.log(`Checking for deleted reviews. Found ${allGoogleReviewIds.length} reviews on Google.`);
      
      // Get all review IDs currently in the database for this user
      const { data: dbReviews, error: dbReviewsError } = await supabaseAdmin
        .from("reviews")
        .select("id, review_id, author, rating")
        .eq("user_id", user.id);
      
      if (!dbReviewsError && dbReviews) {
        // Find reviews in DB that are not in Google anymore
        const googleReviewIdSet = new Set(allGoogleReviewIds);
        const reviewsToDelete = dbReviews.filter(r => !googleReviewIdSet.has(r.review_id));
        
        if (reviewsToDelete.length > 0) {
          console.log(`Found ${reviewsToDelete.length} reviews to delete (no longer on Google)`);
          
          // Create notifications for deleted reviews BEFORE deleting them
          for (const deletedReview of reviewsToDelete) {
            await supabaseAdmin.from("notifications").insert({
              user_id: user.id,
              type: "review_deleted",
              title: "🗑️ Avis supprimé",
              message: `L'avis de ${deletedReview.author} (${deletedReview.rating} étoiles) a été supprimé de Google`,
              review_id: null, // Review will be deleted so no link
            });
          }
          
          const idsToDelete = reviewsToDelete.map(r => r.id);
          const { error: deleteError } = await supabaseAdmin
            .from("reviews")
            .delete()
            .in("id", idsToDelete);
          
          if (deleteError) {
            console.error("Error deleting old reviews:", deleteError);
            errors.push(`Failed to delete ${reviewsToDelete.length} removed reviews`);
          } else {
            deletedCount = reviewsToDelete.length;
            console.log(`Successfully deleted ${deletedCount} reviews that were removed from Google`);
          }
        }
      }
    }

    // Determine requires_reconnect based on all error types
    const requiresReconnect = tokenResult.requires_reconnect || hasApiDisabledError;

    const response = {
      success: true,
      message: `Synced ${allReviews.length} reviews${deletedCount > 0 ? `, deleted ${deletedCount} removed reviews` : ''}`,
      reviews: allReviews,
      synced_count: allReviews.length,
      deleted_count: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      requires_reconnect: requiresReconnect
    };

    return new Response(
      JSON.stringify(response),
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
        requires_reconnect: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
