import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get a valid Google access token server-side
async function getValidAccessToken(supabaseAdmin: any, userId: string): Promise<{ token: string | null; error: string | null }> {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error("Missing Google OAuth credentials");
    return { token: null, error: "Configuration error: Missing Google OAuth credentials" };
  }

  // Get user profile with tokens
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    return { token: null, error: "User profile not found" };
  }

  if (!profile.google_refresh_token) {
    console.log("No refresh token available for user", userId);
    return { token: null, error: "requires_reconnect" };
  }

  // Check if current token is still valid (with 5 min buffer)
  const expiresAt = profile.google_token_expires_at ? new Date(profile.google_token_expires_at) : null;
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (profile.google_access_token && expiresAt && (expiresAt.getTime() - bufferMs) > now.getTime()) {
    console.log("Using existing valid access token");
    return { token: profile.google_access_token, error: null };
  }

  // Need to refresh the token
  console.log("Refreshing access token...");
  try {
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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token refresh failed:", tokenResponse.status, errorText);
      
      // Check if refresh token is revoked
      if (errorText.includes("invalid_grant") || errorText.includes("Token has been revoked")) {
        // Clear invalid tokens
        await supabaseAdmin
          .from("profiles")
          .update({
            google_access_token: null,
            google_refresh_token: null,
            google_token_expires_at: null,
          })
          .eq("id", userId);
        
        return { token: null, error: "requires_reconnect" };
      }
      
      return { token: null, error: `Token refresh failed: ${tokenResponse.status}` };
    }

    const tokenData = await tokenResponse.json();
    const newAccessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 3600;
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Update profile with new token
    await supabaseAdmin
      .from("profiles")
      .update({
        google_access_token: newAccessToken,
        google_token_expires_at: newExpiresAt,
        // Update refresh token if a new one was provided
        ...(tokenData.refresh_token && { google_refresh_token: tokenData.refresh_token }),
      })
      .eq("id", userId);

    console.log("Successfully refreshed access token");
    return { token: newAccessToken, error: null };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return { token: null, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

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

    // Create admin client for server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create user client for auth check
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

    console.log("User authenticated:", user.id);

    // Get access token - prefer server-side refresh, fallback to provider_token
    let accessToken: string | null = null;
    
    // Try to get token server-side first
    const { token: serverToken, error: tokenError } = await getValidAccessToken(supabaseAdmin, user.id);
    
    if (serverToken) {
      accessToken = serverToken;
      console.log("Using server-side access token");
    } else if (provider_token) {
      accessToken = provider_token;
      console.log("Falling back to client provider_token");
    } else if (tokenError === "requires_reconnect") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          requires_reconnect: true,
          message: "Reconnectez votre compte Google Business pour publier des réponses."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: tokenError || "Impossible d'obtenir un token Google valide."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the review with AI response
    const { data: review, error: reviewError } = await supabaseAdmin
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

    console.log(`Review ID format: ${review.review_id}`);
    console.log(`Location ID: ${review.location_id}`);
    
    // First, get the account ID by listing accounts
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
      
      if (accountsResponse.status === 401) {
        // Token might be expired, clear it and ask for reconnect
        await supabaseAdmin
          .from("profiles")
          .update({
            google_access_token: null,
            google_token_expires_at: null,
          })
          .eq("id", user.id);
        
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
          Authorization: `Bearer ${accessToken}`,
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
      
      if (googleResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            requires_reconnect: true,
            message: "Session Google expirée. Reconnectez votre compte Google."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
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
    const { error: updateError } = await supabaseAdmin
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
    await supabaseAdmin
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