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
    const locationName = `locations/${review.location_id}`;
    const reviewName = review.review_id.startsWith("accounts/") 
      ? review.review_id 
      : `${locationName}/reviews/${review.review_id}`;

    console.log(`Publishing reply to: ${reviewName}`);

    // Call Google My Business API to update the review reply
    const googleResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
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
