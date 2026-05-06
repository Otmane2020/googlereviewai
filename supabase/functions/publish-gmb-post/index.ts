import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublishRequest {
  business_id: string;
  summary: string;
  topic_type?: "STANDARD" | "EVENT" | "OFFER";
  cta_type?: string;
  cta_url?: string;
  media_url?: string;
  post_id?: string; // If provided, update existing scheduled post
  user_id?: string; // For cron/admin calls
  // EVENT / OFFER fields
  event_title?: string;
  start_date?: string; // ISO datetime
  end_date?: string;   // ISO datetime
  coupon_code?: string;
  terms_conditions?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body: PublishRequest = await req.json();
    const { business_id, summary, topic_type = "STANDARD", cta_type, cta_url, media_url, post_id, user_id: cronUserId } = body;

    let userId: string;

    // Check if this is a cron call (user_id provided) or user call (auth header)
    if (cronUserId) {
      // Cron job call - use provided user_id
      userId = cronUserId;
      console.log("[publish-gmb-post] Cron call for user:", userId);
    } else {
      // User call - verify auth
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header");
      }

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }
      userId = user.id;
      console.log("[publish-gmb-post] User call:", userId);
    }

    if (!business_id || !summary) {
      throw new Error("business_id and summary are required");
    }

    console.log(`[publish-gmb-post] Publishing post for business: ${business_id}`);

    // Verify business ownership
    const { data: business, error: bizError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, google_place_id")
      .eq("id", business_id)
      .eq("user_id", userId)
      .single();

    if (bizError || !business) {
      throw new Error("Business not found or access denied");
    }

    if (!business.google_place_id) {
      throw new Error("Business has no Google Place ID");
    }

    // Get Google access token
    const tokenResult = await getGoogleAccessToken(supabaseAdmin, userId);
    if (!tokenResult.token) {
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

    // Build the post body
    const postBody: any = {
      languageCode: "fr",
      summary: summary,
      topicType: topic_type,
    };

    // Add call to action if provided
    if (cta_type && cta_url) {
      postBody.callToAction = {
        actionType: cta_type,
        url: cta_url,
      };
    }

    // Add media if provided
    if (media_url) {
      postBody.media = [{
        mediaFormat: "PHOTO",
        sourceUrl: media_url,
      }];
    }

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
          console.log(`[publish-gmb-post] Trying URL: ${url}`);
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(postBody),
          });

          if (response.ok) {
            publishedPost = await response.json();
            console.log(`[publish-gmb-post] Post published successfully:`, publishedPost.name);
            break;
          } else {
            const errorText = await response.text();
            console.log(`[publish-gmb-post] URL failed (${response.status}):`, errorText);
            publishError = `${response.status}: ${errorText}`;
          }
        } catch (e) {
          console.error(`[publish-gmb-post] Request failed:`, e);
          publishError = e instanceof Error ? e.message : "Unknown error";
        }
      }

      if (publishedPost) break;
    }

    if (!publishedPost) {
      throw new Error(publishError || "Failed to publish post to Google");
    }

    // Save to database
    const postData = {
      user_id: userId,
      business_id: business_id,
      google_post_id: publishedPost.name,
      topic_type: topic_type,
      summary: summary,
      cta_type: cta_type || null,
      cta_url: cta_url || null,
      media_url: media_url || null,
      posted_at: new Date().toISOString(),
      status: "published",
    };

    if (post_id) {
      // Update existing scheduled post
      await supabaseAdmin
        .from("gmb_posts")
        .update({
          ...postData,
          scheduled_for: null,
        })
        .eq("id", post_id)
        .eq("user_id", userId);
    } else {
      // Insert new post
      await supabaseAdmin.from("gmb_posts").insert(postData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        post: publishedPost,
        message: "Post published to Google My Business",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[publish-gmb-post] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
