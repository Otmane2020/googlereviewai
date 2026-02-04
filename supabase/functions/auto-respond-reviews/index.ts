import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate AI response using OpenRouter
async function generateAIResponse(
  review: any,
  aiSettings: any,
  businessName: string
): Promise<string | null> {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_API_KEY) {
    console.error("[AutoRespond] OPENROUTER_API_KEY not configured");
    return null;
  }

  const tone = aiSettings?.tone || "friendly";
  const responseLength = aiSettings?.response_length || "M";
  const includeSignature = aiSettings?.include_signature ?? true;
  const signature = aiSettings?.signature?.replace("{business_name}", businessName) || "";
  const customTemplate = aiSettings?.custom_template || "";

  const lengthMap: Record<string, string> = {
    S: "Keep the response brief, around 2-3 sentences.",
    M: "Write a medium-length response, around 4-5 sentences.",
    L: "Write a detailed response, around 6-8 sentences.",
  };
  const lengthInstruction = lengthMap[responseLength] || lengthMap.M;

  const toneMap: Record<string, string> = {
    friendly: "Use a warm, friendly, and approachable tone.",
    professional: "Use a professional and formal tone.",
    casual: "Use a casual and relaxed tone.",
    empathetic: "Use an empathetic and understanding tone.",
    humorous: "Use a light, humorous, and fun tone while remaining respectful.",
    warm: "Use a warm, caring, and compassionate tone.",
  };
  const toneInstruction = toneMap[tone] || toneMap.friendly;

  const systemPrompt = `You are an AI assistant that generates professional responses to customer reviews in French.
${toneInstruction}
${lengthInstruction}
Always thank the customer and address their specific feedback.
${review.rating >= 4 ? "This is a positive review, express gratitude." : "This is a critical review, show empathy and offer to improve."}
${customTemplate ? `Additional instructions: ${customTemplate}` : ""}
${includeSignature && signature ? `End with this signature: ${signature}` : ""}
Do not include any greeting like "Cher client" - start directly with the response.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://starlinko.com",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a response for this ${review.rating}-star review from ${review.author}: "${review.comment || "No comment provided"}"` },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[AutoRespond] OpenRouter error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// Cache for Google account ID per user
const accountIdCache: Record<string, string> = {};

// Get Google account ID
async function getGoogleAccountId(accessToken: string, userId: string): Promise<string | null> {
  // Check cache first
  if (accountIdCache[userId]) {
    return accountIdCache[userId];
  }

  try {
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!accountsResponse.ok) {
      console.error(`[AutoRespond] Failed to fetch accounts: ${accountsResponse.status}`);
      return null;
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    if (accounts.length === 0) {
      console.error("[AutoRespond] No Google Business accounts found");
      return null;
    }

    const accountId = accounts[0].name.split("/")[1];
    accountIdCache[userId] = accountId;
    console.log(`[AutoRespond] Got account ID for user ${userId}: ${accountId}`);
    return accountId;
  } catch (error) {
    console.error("[AutoRespond] Error fetching account ID:", error);
    return null;
  }
}

// Publish reply to Google
async function publishToGoogle(
  accessToken: string,
  review: any,
  aiResponse: string,
  userId: string
): Promise<boolean> {
  // First, get the Google account ID
  const accountId = await getGoogleAccountId(accessToken, userId);
  if (!accountId) {
    console.error("[AutoRespond] Cannot publish without account ID");
    return false;
  }

  // Extract the unique review ID from whatever format we have
  // review_id can be: "locations/xxx/reviews/AbFv...", "AbFv...", or full path
  let uniqueReviewId = review.review_id;
  if (uniqueReviewId.includes("/reviews/")) {
    uniqueReviewId = uniqueReviewId.split("/reviews/").pop();
  }

  // Build full path: accounts/xxx/locations/xxx/reviews/xxx
  const fullReviewPath = `accounts/${accountId}/locations/${review.location_id}/reviews/${uniqueReviewId}`;
  
  console.log(`[AutoRespond] Publishing to Google: ${fullReviewPath}`);

  const googleResponse = await fetch(
    `https://mybusiness.googleapis.com/v4/${fullReviewPath}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: aiResponse }),
    }
  );

  if (!googleResponse.ok) {
    const errorText = await googleResponse.text();
    console.error("[AutoRespond] Google API error:", googleResponse.status, errorText);
    return false;
  }

  console.log(`[AutoRespond] Successfully published to Google!`);
  return true;
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

    console.log("[AutoRespond] Starting auto-respond-reviews job...");

    // Get users with AI enabled
    const { data: settings } = await supabase
      .from("ai_settings")
      .select("user_id, auto_sync_reviews, auto_publish_to_google, minimum_rating, auto_reply_delay, tone, response_length, include_signature, signature, custom_template, only_positive_reviews, respond_to_edited_reviews, created_at")
      .eq("enabled", true);

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users with AI enabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalResponses = 0;
    let totalPublished = 0;

    for (const userSettings of settings) {
      try {
        // Get profile with credits and email
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, google_refresh_token, email, full_name")
          .eq("id", userSettings.user_id)
          .single();

        if (!profile || profile.credits < 1) {
          console.log(`[AutoRespond] User ${userSettings.user_id} has insufficient credits`);
          
          // Send upgrade email if credits are 0 and user has pending reviews
          if (profile && profile.credits === 0 && profile.email) {
            // Count ONLY reviews that are truly awaiting an automatic AI reply.
            // Previously we counted all rows with ai_response = null, which can include
            // historical reviews that already have a Google reply (=> wrong, can show 66).
            const { count: pendingCount } = await supabase
              .from("reviews")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userSettings.user_id)
              .is("ai_response", null)
              .is("google_reply", null)
              .eq("replied", false);
            
            if (pendingCount && pendingCount > 0) {
              // Check if we already sent an email recently (last 24h)
              const { data: recentNotif } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", userSettings.user_id)
                .eq("type", "low_credits")
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .limit(1);
              
              if (!recentNotif || recentNotif.length === 0) {
                console.log(`[AutoRespond] Sending upgrade email to ${profile.email}`);
                
                // Send upgrade email via send-engagement-email function
                try {
                  const emailResponse = await fetch(
                    `${supabaseUrl}/functions/v1/send-engagement-email`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${supabaseServiceKey}`,
                      },
                      body: JSON.stringify({
                        email: profile.email,
                        name: profile.full_name || "Client",
                        type: "no_credits_upgrade",
                        data: { pending_count: pendingCount, credits: 0 }
                      }),
                    }
                  );
                  
                  if (emailResponse.ok) {
                    console.log(`[AutoRespond] Upgrade email sent to ${profile.email}`);
                  } else {
                    console.error(`[AutoRespond] Failed to send upgrade email:`, await emailResponse.text());
                  }
                } catch (emailError) {
                  console.error(`[AutoRespond] Email sending error:`, emailError);
                }
                
                // Create in-app notification for upgrade
                await supabase.from("notifications").insert({
                  user_id: userSettings.user_id,
                  type: "low_credits",
                  title: "⚠️ Crédits épuisés",
                  message: `${pendingCount} avis attendent une réponse. Rechargez vos crédits pour continuer.`,
                });
              }
            }
          }
          
          continue;
        }

        // Get AI settings creation date to only process NEW reviews (after AI was enabled)
        const aiEnabledAt = userSettings.created_at;
        
        // Determine minimum rating based on only_positive_reviews setting
        const minRating = userSettings.only_positive_reviews ? 4 : (userSettings.minimum_rating || 1);

        // Get reviews without AI response - ONLY reviews created AFTER AI was enabled
        // This prevents processing old reviews that were synced in bulk
        let reviewsQuery = supabase
          .from("reviews")
          .select("*")
          .eq("user_id", userSettings.user_id)
          .is("ai_response", null)
          .is("google_reply", null) // Skip reviews already replied on Google
          .eq("replied", false) // Skip reviews marked as replied
          .gte("rating", minRating)
          .order("created_at", { ascending: true }) // Process oldest NEW reviews first
          .limit(5);
        
        // Only add the date filter if we have a valid AI enabled date
        if (aiEnabledAt) {
          reviewsQuery = reviewsQuery.gte("review_date", aiEnabledAt);
        }

        const { data: newReviews } = await reviewsQuery;
        
        // Also get edited reviews that need a new response (if option is enabled)
        let editedReviews: any[] = [];
        if (userSettings.respond_to_edited_reviews) {
          const { data: edited } = await supabase
            .from("reviews")
            .select("*")
            .eq("user_id", userSettings.user_id)
            .eq("needs_new_response", true)
            .gte("rating", minRating)
            .order("last_edited_at", { ascending: true })
            .limit(5);
          
          editedReviews = edited || [];
          if (editedReviews.length > 0) {
            console.log(`[AutoRespond] Found ${editedReviews.length} edited reviews needing new response for user ${userSettings.user_id}`);
          }
        }
        
        // Combine new and edited reviews
        const reviews = [...(newReviews || []), ...editedReviews];

        if (reviews.length === 0) {
          console.log(`[AutoRespond] No pending reviews for user ${userSettings.user_id}`);
          continue;
        }

        console.log(`[AutoRespond] Found ${reviews.length} reviews to process (${newReviews?.length || 0} new, ${editedReviews.length} edited) for user ${userSettings.user_id}`);

        // Get business name
        const { data: business } = await supabase
          .from("businesses")
          .select("name")
          .eq("user_id", userSettings.user_id)
          .limit(1)
          .single();

        const businessName = business?.name || "Notre équipe";

        for (const review of reviews) {
          if (profile.credits < 1) break;

          // Check if review is old enough based on auto_reply_delay
          // Use the SYNC time (created_at) not the Google review date
          // This ensures we wait X minutes after WE discovered the review
          const syncedAt = new Date(review.created_at);
          const delayMinutes = userSettings.auto_reply_delay || 5;
          const now = new Date();
          const timeSinceSyncMinutes = (now.getTime() - syncedAt.getTime()) / (1000 * 60);

          console.log(`[AutoRespond] Review ${review.id} from ${review.author}: synced ${timeSinceSyncMinutes.toFixed(1)} min ago, delay required: ${delayMinutes} min`);

          if (timeSinceSyncMinutes < delayMinutes) {
            console.log(`[AutoRespond] Review ${review.id} is too recent, waiting ${(delayMinutes - timeSinceSyncMinutes).toFixed(1)} more minutes`);
            continue;
          }

          console.log(`[AutoRespond] Review ${review.id} passed delay check, proceeding with AI response generation`);

          // Generate AI response using Lovable AI Gateway
          const aiResponse = await generateAIResponse(
            review,
            userSettings,
            businessName
          );

          if (!aiResponse) continue;

          // Update review with AI response and clear needs_new_response flag
          const isEditedReview = review.needs_new_response === true;
          await supabase
            .from("reviews")
            .update({ 
              ai_response: aiResponse,
              needs_new_response: false, // Clear the flag
              published_to_google: false, // Reset published status for re-publication
            })
            .eq("id", review.id);

          // Deduct credit
          const newCredits = profile.credits - 1;
          await supabase
            .from("profiles")
            .update({ credits: newCredits })
            .eq("id", userSettings.user_id);
          profile.credits = newCredits;

          // Log credit usage
          await supabase.from("credits_history").insert({
            user_id: userSettings.user_id,
            amount: -1,
            type: "usage",
            description: isEditedReview 
              ? `Nouvelle réponse IA pour l'avis modifié de ${review.author}`
              : `Auto-réponse IA pour l'avis de ${review.author}`,
          });

          totalResponses++;

          // Create notification for AI response
          await supabase.from("notifications").insert({
            user_id: userSettings.user_id,
            type: isEditedReview ? "ai_response_edited" : "ai_response",
            title: isEditedReview 
              ? "🔄 Nouvelle réponse IA générée"
              : "Réponse IA générée automatiquement",
            message: isEditedReview
              ? `Une nouvelle réponse a été générée suite à la modification de l'avis de ${review.author}`
              : `Une réponse a été générée pour l'avis de ${review.author}`,
            review_id: review.id,
          });

          // Auto-publish if enabled and user has Google token
          if (userSettings.auto_publish_to_google && profile.google_refresh_token) {
            // Get access token using shared helper (SERVICE_ROLE client)
            const tokenResult = await getGoogleAccessToken(supabase, userSettings.user_id);

            if (tokenResult.token) {
              const published = await publishToGoogle(tokenResult.token, review, aiResponse, userSettings.user_id);
              
              if (published) {
                await supabase
                  .from("reviews")
                  .update({
                    replied: true,
                    published_to_google: true,
                    published_at: new Date().toISOString(),
                  })
                  .eq("id", review.id);

                totalPublished++;

                // Notification for publication
                await supabase.from("notifications").insert({
                  user_id: userSettings.user_id,
                  type: "reply_published",
                  title: "Réponse publiée sur Google",
                  message: `Votre réponse à l'avis de ${review.author} a été publiée automatiquement.`,
                  review_id: review.id,
                });
              }
            } else {
              console.log(`[AutoRespond] Could not get token for user ${userSettings.user_id}: ${tokenResult.error}`);
            }
          }
        }
      } catch (userError) {
        console.error(`[AutoRespond] Error processing user ${userSettings.user_id}:`, userError);
      }
    }

    const message = `[AutoRespond] Completed: ${totalResponses} responses generated, ${totalPublished} published to Google`;
    console.log(message);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        responses_generated: totalResponses,
        published_to_google: totalPublished,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[AutoRespond] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
