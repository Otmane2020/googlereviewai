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

    const { review_id, provider_token } = await req.json();
    
    if (!review_id) {
      throw new Error("review_id is required");
    }

    if (!provider_token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No Google access token. Please sign out and sign in again with Google."
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
      throw new Error("User not authenticated");
    }

    // Fetch the review with AI response
    const { data: review, error: reviewError } = await supabaseClient
      .from("reviews")
      .select("*")
      .eq("id", review_id)
      .eq("user_id", user.id)
      .single();

    if (reviewError || !review) {
      throw new Error("Review not found");
    }

    if (!review.ai_response) {
      throw new Error("No AI response to publish");
    }

    if (review.published_to_google) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Response already published to Google"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the Google API URL for updating the review reply
    // review_id is stored as "locations/{locationId}/reviews/{reviewId}"
    // We need the format "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
    // But we don't store accountId, so we need to find it first
    
    console.log(`Review ID format: ${review.review_id}`);
    console.log(`Location ID: ${review.location_id}`);
    
    // First, get the account ID by listing accounts
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
            requires_reconnect: true,
            message: "Session Google expirée. Reconnectez votre compte Google."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Failed to fetch Google accounts: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    if (accounts.length === 0) {
      throw new Error("No Google Business accounts found");
    }

    // Use the first account (most common case)
    const accountId = accounts[0].name.split("/")[1];
    
    // Extract the review unique ID from our stored review_id
    // Format: "locations/{locationId}/reviews/{uniqueReviewId}"
    const reviewIdParts = review.review_id.split("/reviews/");
    const uniqueReviewId = reviewIdParts.length > 1 ? reviewIdParts[1] : review.review_id;
    
    // Build full path: accounts/{accountId}/locations/{locationId}/reviews/{uniqueReviewId}
    const fullReviewPath = `accounts/${accountId}/locations/${review.location_id}/reviews/${uniqueReviewId}`;
    
    console.log(`Publishing reply to: ${fullReviewPath}`);

    // Call Google My Business API to update the review reply
    const googleResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/${fullReviewPath}/reply`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${provider_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: review.ai_response,
        }),
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google API error:", googleResponse.status, errorText);
      
      if (googleResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error_code: "QUOTA_EXCEEDED",
            message: "Quota API dépassé. Réessayez plus tard."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (googleResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error_code: "ACCESS_DENIED",
            message: "Accès refusé. Vérifiez les autorisations de votre compte Google."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Google API error: ${googleResponse.status}`);
    }

    const replyData = await googleResponse.json();

    // Update the review in database
    const { error: updateError } = await supabaseClient
      .from("reviews")
      .update({
        replied: true,
        published_to_google: true,
        published_at: new Date().toISOString(),
        google_reply_id: replyData.name || null,
      })
      .eq("id", review_id);

    if (updateError) {
      console.error("Error updating review:", updateError);
    }

    // Create notification
    await supabaseClient
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "reply_published",
        title: "Réponse publiée sur Google",
        message: `Votre réponse à l'avis de ${review.author} a été publiée sur Google.`,
        review_id: review.id,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reply published to Google successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error publishing reply:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
