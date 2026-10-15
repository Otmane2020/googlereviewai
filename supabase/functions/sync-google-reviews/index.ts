import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, preferred_language")
      .eq("id", user.id)
      .maybeSingle();
    const userLang: "fr" | "en" = userProfile?.preferred_language === "en" ? "en" : "fr";

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
    const accounts = [...(accountsData.accounts || [])];
    let nextAccounts = accountsData.nextPageToken as string | undefined;
    let accountPages = 1;
    while (nextAccounts && accountPages < 25) {
      const url = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageToken=" + encodeURIComponent(nextAccounts);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error(`Google Business accounts pagination HTTP ${response.status}`);
      const page = await response.json();
      accounts.push(...(page.accounts || []));
      nextAccounts = page.nextPageToken;
      accountPages++;
    }
    if (nextAccounts) throw new Error("Google Business account list was truncated.");
    
    console.log(`Found ${accounts.length} Google Business accounts`);

    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Aucun compte Google Business accessible. Vérifiez les autorisations Google.",
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
    let matchedLocations = 0;
    let fetchedLocations = 0;

    // For each account, fetch locations and their reviews
    for (const account of accounts) {
      const accountName = account.name;
      const accountId = accountName.split("/")[1];
      console.log(`Processing account: ${accountName} (ID: ${accountId})`);

      try {
        // Get locations for this account
        // Enumerate every page. A selected managed listing may not appear
        // among Google's first 100 locations.
        const locations: any[] = [];
        let nextLocations: string | undefined;
        let locationPages = 0;
        let locationFetchError = false;
        do {
          const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`);
          url.searchParams.set("readMask", "name,title,storefrontAddress");
          url.searchParams.set("pageSize", "100");
          if (nextLocations) url.searchParams.set("pageToken", nextLocations);
          const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
          if (!response.ok) {
            errors.push(`Compte Google ${accountId} : impossible d'accéder aux fiches (${response.status})`);
            locationFetchError = true;
            break;
          }
          const page = await response.json();
          locations.push(...(page.locations || []));
          nextLocations = page.nextPageToken;
          locationPages++;
        } while (nextLocations && locationPages < 25);
        if (locationFetchError || nextLocations) {
          if (nextLocations) errors.push(`Compte Google ${accountId} : liste de fiches incomplète`);
          continue;
        }
        
        console.log(`Found ${locations.length} locations for ${accountName}`);

        // Fetch reviews for each location
        for (const location of locations) {
          const locationName = location.name;
          const locationId = locationName.split("/")[1];
          const locationTitle = location.title || "Unknown Location";
          
          console.log(`Fetching reviews for ${locationTitle} (Location ID: ${locationId})`);

          const matchedBusinessId = businessMap.get(locationId);
          if (!matchedBusinessId) {
            // Retain Google discovery, but never import/reply on reviews of
            // a location outside the customer's managed-location selection.
            console.log(`Skipping unmanaged Google location: ${locationId}`);
            continue;
          }
          matchedLocations++;
          console.log(`Matched business_id: ${matchedBusinessId}`);
          const errorsBeforeLocation = errors.length;
          let googleTotalForLocation: number | null = null;
          let returnedForLocation = 0;
          let validGoogleResponse = false;

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

              if (pageCount === 1) fetchedLocations++;
              const reviewsData = await reviewsResponse.json();
              const reviews = reviewsData.reviews || [];
              validGoogleResponse = true;
              returnedForLocation += reviews.length;
              if (pageCount === 1 && Number.isFinite(Number(reviewsData.totalReviewCount))) {
                googleTotalForLocation = Number(reviewsData.totalReviewCount);
              }
              nextPageToken = reviewsData.nextPageToken || null;
              
              // Extract Google's totalReviewCount and averageRating from the response
              const googleTotalReviewCount = reviewsData.totalReviewCount;
              const googleAverageRating = reviewsData.averageRating;
              
              console.log(`Found ${reviews.length} reviews on page ${pageCount} for ${locationTitle}${nextPageToken ? ' (more pages available)' : ''}`);
              console.log(`Google reports: totalReviewCount=${googleTotalReviewCount}, averageRating=${googleAverageRating}`);
              
              // Update the business with Google's official count (first page only has the totals)
              if (pageCount === 1 && matchedBusinessId && googleTotalReviewCount !== undefined) {
                const updateData: Record<string, unknown> = {
                  updated_at: new Date().toISOString(),
                };
                if (googleTotalReviewCount !== undefined) {
                  updateData.total_reviews = googleTotalReviewCount;
                }
                if (googleAverageRating !== undefined) {
                  updateData.rating = googleAverageRating;
                }
                
                const { error: updateError } = await supabaseAdmin
                  .from("businesses")
                  .update(updateData)
                  .eq("id", matchedBusinessId);
                
                if (updateError) {
                  console.error(`Failed to update business stats for ${matchedBusinessId}:`, updateError);
                } else {
                  console.log(`✅ Updated business ${matchedBusinessId}: total_reviews=${googleTotalReviewCount}, rating=${googleAverageRating}`);
                }
              }

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
                // Extract original comment - prefer originalComment, otherwise parse from translated format
                let originalComment = review.originalComment || review.comment || "";
                
                // If comment contains "(Original)" pattern, extract only the original text
                // Format: "(Translated by Google) translated text (Original) original text"
                if (!review.originalComment && originalComment.includes("(Original)")) {
                  const originalMatch = originalComment.match(/\(Original\)\s*(.*)$/s);
                  if (originalMatch && originalMatch[1]) {
                    originalComment = originalMatch[1].trim();
                  }
                }
                
                // If the review already has a Google reply, it's already handled
                // Mark as notified to prevent notification trigger from firing for old reviews
                const hasGoogleReply = !!review.reviewReply;
                
                reviewsToUpsert.push({
                  user_id: user.id,
                  review_id: canonicalReviewId,
                  location_id: locationId,
                  author: review.reviewer?.displayName || "Anonyme",
                  rating: rating,
                  comment: originalComment,
                  review_date: review.createTime || new Date().toISOString(),
                  replied: hasGoogleReply,
                  google_reply: review.reviewReply?.comment || null,
                  photos: photos.length > 0 ? photos : [],
                  criteria: criteria,
                  // Pre-mark as notified if already has a reply to avoid spam notifications
                  // This will be overwritten later for existing reviews
                });
                
                // Track this review ID from Google
                allGoogleReviewIds.push(canonicalReviewId);
              }
              
              // Check which reviews already exist in DB and detect edits
              if (reviewsToUpsert.length > 0) {
                const { data: existingReviews } = await supabaseAdmin
                  .from("reviews")
                  .select("id, review_id, comment, ai_response, needs_new_response, edit_count, last_edited_at")
                  .eq("user_id", user.id)
                  .in("review_id", reviewIdsInPage);
                
                const existingReviewMap = new Map((existingReviews || []).map(r => [r.review_id, r]));
                
                // For existing reviews, mark as notified and detect edits
                // For new reviews, let the trigger handle notification (notified will be false/null)
                
                // Helper to normalize comments for comparison (extract original text)
                const normalizeComment = (comment: string | null): string => {
                  if (!comment) return "";
                  // Remove Google translation prefix to compare actual content
                  if (comment.includes("(Original)")) {
                    const match = comment.match(/\(Original\)\s*(.*)$/s);
                    return match?.[1]?.trim() || comment;
                  }
                  return comment.trim();
                };
                
                const reviewsWithNotified = reviewsToUpsert.map(r => {
                  const existing = existingReviewMap.get(r.review_id);
                  if (existing) {
                    // Check if comment was actually edited by comparing normalized versions
                    const existingNormalized = normalizeComment(existing.comment);
                    const newNormalized = normalizeComment(r.comment);
                    
                    // Only consider it an edit if:
                    // 1. The normalized content actually changed (not just whitespace)
                    // 2. The review wasn't already flagged as needing response (to prevent duplicate notifications)
                    const contentChanged = existingNormalized !== newNormalized && newNormalized !== "";
                    const alreadyFlagged = existing.needs_new_response === true;
                    const isNewEdit = contentChanged && !alreadyFlagged;
                    
                    if (isNewEdit) {
                      console.log(`[Sync] Review ${r.review_id} was edited by customer (first detection)`);
                      console.log(`[Sync] Old: "${existingNormalized.substring(0, 50)}..." -> New: "${newNormalized.substring(0, 50)}..."`);
                      return {
                        ...r,
                        notified: true,
                        last_edited_at: new Date().toISOString(),
                        edit_count: (existing as any).edit_count ? (existing as any).edit_count + 1 : 1,
                        needs_new_response: existing.ai_response ? true : false,
                        _isNewEdit: true, // Marker for notification
                      };
                    }
                    // Keep existing state for already-flagged reviews
                    return { 
                      ...r, 
                      notified: true,
                      needs_new_response: existing.needs_new_response || false,
                      edit_count: existing.edit_count || 0,
                      last_edited_at: existing.last_edited_at || null,
                    };
                  }
                  return { ...r, notified: false };
                });
                
                // Only count NEWLY detected edited reviews for notification (not already flagged ones)
                const newlyEditedReviews = reviewsWithNotified.filter((r: any) => r._isNewEdit);
                
                console.log(`Batch upserting ${reviewsWithNotified.length} reviews (${existingReviewMap.size} existing, ${reviewsWithNotified.length - existingReviewMap.size} new, ${newlyEditedReviews.length} newly edited) for ${locationTitle}`);
                
                // Remove the internal marker before upserting
                const reviewsToSave = reviewsWithNotified.map(({ _isNewEdit, ...rest }) => rest);
                
                const { data: upsertedReviews, error: upsertError } = await supabaseAdmin
                  .from("reviews")
                  .upsert(reviewsToSave, { 
                    onConflict: "review_id,user_id",
                    ignoreDuplicates: false 
                  })
                  .select();
                
                if (upsertError) {
                  console.error("Batch upsert error:", upsertError);
                  errors.push(`${locationTitle}: ${upsertError.message}`);
                } else if (upsertedReviews) {
                  allReviews.push(...upsertedReviews);
                  
                  // Create notifications ONLY for newly detected edited reviews
                  for (const editedReview of newlyEditedReviews) {
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
              errors.push(`${locationTitle} : Google possède d’autres pages d’avis, synchronisation partielle`);
            }
          } catch (error) {
            console.error(`Error fetching reviews for ${locationTitle}:`, error);
            errors.push(`${locationTitle}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }

          if (validGoogleResponse && googleTotalForLocation !== null && googleTotalForLocation > returnedForLocation) {
            errors.push(`${locationTitle}: Google annonce ${googleTotalForLocation} avis mais n'en renvoie que ${returnedForLocation} via son API.`);
          }
          const locationErrors = errors.slice(errorsBeforeLocation);
          const status = locationErrors.length ? "api_error"
            : returnedForLocation ? "reviews_imported" : validGoogleResponse ? "google_empty" : "api_error";
          const { error: diagnosticError } = await supabaseAdmin.from("businesses").update({
            last_reviews_sync_at: new Date().toISOString(),
            last_reviews_sync_status: status,
            last_reviews_sync_error: locationErrors.length ? locationErrors.join(" ; ").slice(0, 1200) : null,
            last_google_reviews_total: googleTotalForLocation,
          }).eq("id", matchedBusinessId).eq("user_id", user.id);
          if (diagnosticError) errors.push(`Diagnostic de synchronisation : ${diagnosticError.message}`);
        }
      } catch (error) {
        console.error(`Error processing account ${accountName}:`, error);
        errors.push(`Account ${accountId}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Delete reviews that no longer exist on Google
    // BUT ONLY for locations that were actually synced successfully
    let deletedCount = 0;
    
    // GUARD 1: Skip deletion if there were API errors (403, 429, etc.)
    const hasCriticalErrors = errors.length > 0;
    
    if (hasCriticalErrors) {
      console.log("[SAFETY] Skipping deletion detection due to API errors - avoiding false positives");
    } else if (allGoogleReviewIds.length > 0) {
      console.log(`Checking for deleted reviews. Found ${allGoogleReviewIds.length} reviews on Google.`);
      
      // Extract location IDs that were successfully synced
      const syncedLocationIds = [...new Set(allGoogleReviewIds.map(id => {
        // review_id format: "locations/{locationId}/reviews/{reviewId}"
        const match = id.match(/^locations\/([^\/]+)\//);
        return match ? match[1] : null;
      }).filter(Boolean))];
      
      console.log(`Successfully synced ${syncedLocationIds.length} locations:`, syncedLocationIds);
      
      // FIX: Only get reviews from locations that were actually synced
      const { data: dbReviews, error: dbReviewsError } = await supabaseAdmin
        .from("reviews")
        .select("id, review_id, author, rating, location_id")
        .eq("user_id", user.id)
        .in("location_id", syncedLocationIds); // ← KEY FIX: Filter by synced locations
      
      if (!dbReviewsError && dbReviews) {
        // GUARD 2: Skip if we fetched significantly fewer reviews than DB has (pagination incomplete)
        // Allow 10% tolerance for timing differences
        const paginationIncomplete = allGoogleReviewIds.length < (dbReviews.length * 0.9);
        
        if (paginationIncomplete) {
          console.log(`[SAFETY] Skipping deletion detection - likely incomplete pagination: fetched ${allGoogleReviewIds.length} but DB has ${dbReviews.length}`);
        } else {
          // Find reviews in DB that are not in Google anymore
          const googleReviewIdSet = new Set(allGoogleReviewIds);
          let reviewsToDelete = dbReviews.filter(r => !googleReviewIdSet.has(r.review_id));
          
          // GUARD 3: Safety threshold - max 10% deletions (reduced from 20%) AND max 5 absolute
          const maxDeletionsPercent = Math.ceil(dbReviews.length * 0.10);
          const maxDeletions = Math.min(maxDeletionsPercent, 5);
          if (reviewsToDelete.length > maxDeletions && maxDeletions > 0) {
            console.warn(`[SAFETY] Too many deletions detected (${reviewsToDelete.length}), capping at ${maxDeletions} (10% / max 5 threshold)`);
            reviewsToDelete = reviewsToDelete.slice(0, maxDeletions);
          }
          
          if (reviewsToDelete.length > 0) {
            console.log(`Found ${reviewsToDelete.length} reviews to delete (no longer on Google)`);
            
            // Create notifications for deleted reviews BEFORE deleting them
            for (const deletedReview of reviewsToDelete) {
              const deletedTitle = userLang === "en" ? "🗑️ Review deleted" : "🗑️ Avis supprimé";
              const deletedMessage = userLang === "en"
                ? `${deletedReview.author}'s ${deletedReview.rating}-star review was removed from Google`
                : `L'avis de ${deletedReview.author} (${deletedReview.rating} étoiles) a été supprimé de Google`;
              const deletedEmailBody = userLang === "en"
                ? `${deletedReview.author}'s ${deletedReview.rating}-star review was removed from Google. This may mean the customer deleted their review.`
                : `L'avis de ${deletedReview.author} (${deletedReview.rating} étoiles) a été supprimé de Google. Cela peut indiquer que le client a retiré son avis.`;

              // In-app notification
              await supabaseAdmin.from("notifications").insert({
                user_id: user.id,
                type: "review_deleted",
                title: deletedTitle,
                message: deletedMessage,
                review_id: null, // Review will be deleted so no link
              });
              
              // Send push notification
              try {
                await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                  },
                  body: JSON.stringify({
                    user_id: user.id,
                    title: deletedTitle,
                    body: deletedMessage,
                    url: "/reviews",
                  }),
                });
              } catch (e) {
                console.error("Failed to send push notification for deleted review:", e);
              }
              
              // Send email notification
              try {
                if (userProfile?.email) {
                  const firstName = userProfile.full_name?.split(" ")[0] || "";
                  const greeting = userLang === "en" ? `Hello${firstName ? ` ${firstName}` : ""},` : `Bonjour${firstName ? ` ${firstName}` : ""},`;
                  const cta = userLang === "en" ? "View my reviews" : "Voir mes avis";
                  const html = `<!DOCTYPE html><html lang="${userLang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f9fafb;"><div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"><h1 style="color:#111827;font-size:24px;margin:0 0 24px 0;">${deletedTitle}</h1><p style="color:#6b7280;font-size:15px;line-height:1.6;">${greeting}</p><p style="color:#6b7280;font-size:15px;line-height:1.6;">${deletedEmailBody}</p><div style="margin:32px 0;"><a href="https://googlereviewai.com/reviews" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:500;">${cta}</a></div><p style="color:#9ca3af;font-size:12px;margin-top:32px;">© 2025 GoogleReviewAI</p></div></body></html>`;
                  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-notification`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                    },
                    body: JSON.stringify({
                      to: userProfile.email,
                      subject: deletedTitle,
                      html,
                      from_name: "GoogleReviewAI",
                    }),
                  });
                }
              } catch (e) {
                console.error("Failed to send email notification for deleted review:", e);
              }
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
    }

    if (matchedLocations === 0 && businessMap.size > 0) {
      errors.push("Aucune des fiches actives sélectionnées n'a été trouvée dans les comptes Google accessibles. Vérifiez que le bon établissement Sweet Deco est autorisé.");
    } else if (matchedLocations > 0 && fetchedLocations === 0 && errors.length === 0) {
      errors.push("Fiche Google trouvée, mais aucun appel de récupération des avis n'a abouti.");
    }
    const requiresReconnect = Boolean(tokenResult.requires_reconnect || hasApiDisabledError);
    const complete = errors.length === 0;
    const noReviewsReturned = complete && matchedLocations > 0 && fetchedLocations > 0 && allReviews.length === 0;
    const response = {
      success: complete,
      partial: !complete && allReviews.length > 0,
      empty_from_google: noReviewsReturned,
      message: noReviewsReturned
        ? "L’API Google a répondu, mais n’a renvoyé aucun avis pour cette fiche. Si vous voyez un avis sur Google Maps, vérifiez la validation de la fiche, les droits du compte et la disponibilité de l’avis dans l’API."
        : complete
        ? `Synchronisation terminée : ${allReviews.length} avis, ${fetchedLocations} fiche(s) lue(s).`
        : `Synchronisation incomplète : ${errors.join(" ; ")}`,
      reviews: allReviews,
      synced_count: allReviews.length,
      matched_locations: matchedLocations,
      fetched_locations: fetchedLocations,
      deleted_count: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      requires_reconnect: requiresReconnect,
    };

    await supabaseAdmin.from("ai_settings").update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: complete ? "success" : allReviews.length > 0 ? "partial" : "error",
      last_sync_error: errors.length ? errors.join(" ; ").slice(0, 1500) : null,
      reviews_synced_count: allReviews.length,
    }).eq("user_id", user.id);

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
