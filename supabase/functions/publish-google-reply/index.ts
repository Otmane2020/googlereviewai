import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Cache for Google account ID (valid for the duration of the function instance)
let cachedAccountId: string | null = null;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { review_id } = await req.json();
    
    if (!review_id) {
      throw new Error("review_id is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Parallel: auth check + review fetch + token fetch
    const [userResult, reviewResult] = await Promise.all([
      supabaseClient.auth.getUser(),
      supabaseAdmin.from("reviews").select("*").eq("id", review_id).single(),
    ]);

    const { data: { user }, error: userError } = userResult;
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Verify review belongs to user
    const review = reviewResult.data;
    if (reviewResult.error || !review || review.user_id !== user.id) {
      throw new Error("Review not found");
    }

    if (!review.ai_response) {
      throw new Error("No AI response to publish");
    }

    if (review.published_to_google) {
      return new Response(
        JSON.stringify({ success: false, message: "Déjà publié sur Google" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const tokenResult = await getGoogleAccessToken(supabaseAdmin, user.id);
    
    if (!tokenResult.token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          requires_reconnect: tokenResult.requires_reconnect,
          message: tokenResult.requires_reconnect 
            ? "Reconnectez votre compte Google Business."
            : (tokenResult.error || "Token Google invalide.")
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenResult.token;

    // Get account ID (use cache if available)
    let accountId = cachedAccountId;
    
    if (!accountId) {
      const accountsResponse = await fetch(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!accountsResponse.ok) {
        if (accountsResponse.status === 401) {
          return new Response(
            JSON.stringify({ success: false, requires_reconnect: true, message: "Session Google expirée." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`);
      }

      const accountsData = await accountsResponse.json();
      const accounts = accountsData.accounts || [];
      
      if (accounts.length === 0) {
        throw new Error("No Google Business accounts found");
      }

      accountId = accounts[0].name.split("/")[1];
      cachedAccountId = accountId;
    }

    // Build review path and publish
    const reviewIdParts = review.review_id.split("/reviews/");
    const uniqueReviewId = reviewIdParts.length > 1 ? reviewIdParts[1] : review.review_id;
    const fullReviewPath = `accounts/${accountId}/locations/${review.location_id}/reviews/${uniqueReviewId}`;
    
    console.log(`Publishing to: ${fullReviewPath}`);

    const googleResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/${fullReviewPath}/reply`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: review.ai_response }),
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google API error:", googleResponse.status, errorText);
      
      if (googleResponse.status === 401) {
        cachedAccountId = null; // Invalidate cache
        return new Response(
          JSON.stringify({ success: false, requires_reconnect: true, message: "Session Google expirée." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (googleResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, message: "Quota API dépassé. Réessayez plus tard." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (googleResponse.status === 403) {
        return new Response(
          JSON.stringify({ success: false, requires_reconnect: true, message: "Accès refusé. Reconnectez Google." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Google API error: ${googleResponse.status}`);
    }

    const replyData = await googleResponse.json();

    // Parallel: update review + create notification
    await Promise.all([
      supabaseAdmin.from("reviews").update({
        replied: true,
        published_to_google: true,
        published_at: new Date().toISOString(),
        google_reply_id: replyData.name || null,
      }).eq("id", review_id),
      supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        type: "reply_published",
        title: "Réponse publiée",
        message: `Réponse à ${review.author} publiée sur Google.`,
        review_id: review.id,
      }),
    ]);

    return new Response(
      JSON.stringify({ success: true, message: "Publié sur Google !" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error publishing reply:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
