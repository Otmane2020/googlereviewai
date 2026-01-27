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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content_id } = await req.json();

    if (!content_id) {
      throw new Error("content_id is required");
    }

    console.log("[publish-gmb-qa] Publishing content:", content_id);

    // Get the scheduled content
    const { data: content, error: contentError } = await supabase
      .from("scheduled_content")
      .select(`
        *,
        businesses (
          id,
          name,
          google_place_id
        )
      `)
      .eq("id", content_id)
      .single();

    if (contentError || !content) {
      throw new Error("Content not found");
    }

    if (content.status === "published") {
      return new Response(
        JSON.stringify({ success: true, message: "Already published" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const business = content.businesses;
    if (!business?.google_place_id) {
      throw new Error("Business not linked to Google My Business");
    }

    // Get Google access token using shared helper
    const tokenResult = await getGoogleAccessToken(supabase, content.user_id);
    if (!tokenResult.token) {
      // Update content with error
      await supabase
        .from("scheduled_content")
        .update({
          status: "error",
          error_message: tokenResult.error || "Token expiré. Reconnectez-vous avec Google.",
        })
        .eq("id", content_id);

      return new Response(
        JSON.stringify({
          success: false,
          error: tokenResult.error || "No Google access token",
          requires_reconnect: tokenResult.requires_reconnect,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenResult.token;

    // Format Q&A for Google My Business post
    const postContent = content.content_type === "aeo_qa"
      ? `❓ ${content.question}\n\n✅ ${content.answer}`
      : content.content || "";

    // Get Google account
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!accountsResponse.ok) {
      throw new Error("Failed to fetch Google accounts");
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      throw new Error("No Google Business accounts found");
    }

    console.log("[publish-gmb-qa] Content:", postContent.slice(0, 100));

    let publishedPost = null;
    let publishError = null;

    // Try to publish to Google
    for (const account of accounts) {
      const accountId = account.name.split("/")[1];
      
      // Try different URL formats
      const urls = [
        `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${business.google_place_id}/localPosts`,
        `https://mybusiness.googleapis.com/v4/${account.name}/locations/${business.google_place_id}/localPosts`,
      ];

      for (const url of urls) {
        try {
          console.log(`[publish-gmb-qa] Trying URL: ${url}`);
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              languageCode: "fr-FR",
              summary: postContent.slice(0, 1500), // GMB limit
              topicType: "STANDARD",
            }),
          });

          if (response.ok) {
            publishedPost = await response.json();
            console.log(`[publish-gmb-qa] Post published successfully:`, publishedPost.name);
            break;
          } else {
            const errorText = await response.text();
            console.log(`[publish-gmb-qa] URL failed (${response.status}):`, errorText);
            publishError = `${response.status}: ${errorText}`;
          }
        } catch (e) {
          console.error(`[publish-gmb-qa] Request failed:`, e);
          publishError = e instanceof Error ? e.message : "Unknown error";
        }
      }

      if (publishedPost) break;
    }

    if (!publishedPost) {
      // Update content with error
      await supabase
        .from("scheduled_content")
        .update({
          status: "error",
          error_message: publishError || "Failed to publish",
        })
        .eq("id", content_id);

      throw new Error(publishError || "Failed to publish post to Google");
    }

    // Update the scheduled content as published
    const { error: updateError } = await supabase
      .from("scheduled_content")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        google_post_id: publishedPost.name || null,
        error_message: null,
      })
      .eq("id", content_id);

    if (updateError) {
      console.error("[publish-gmb-qa] Error updating content:", updateError);
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: content.user_id,
      type: "qa_published",
      title: "Q&A publié sur Google",
      message: `Le Q&A "${content.question?.slice(0, 50)}..." a été publié sur Google My Business.`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        google_post_id: publishedPost.name,
        message: "Q&A published successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[publish-gmb-qa] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
