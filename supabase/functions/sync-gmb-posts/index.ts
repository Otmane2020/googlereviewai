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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a cron call or user call
    const body = await req.json().catch(() => ({}));
    const { user_id: cronUserId, business_id } = body;

    let userId: string;

    if (cronUserId) {
      // Cron job call - use provided user_id
      userId = cronUserId;
      console.log("[sync-gmb-posts] Cron call for user:", userId);
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
      console.log("[sync-gmb-posts] User call:", userId);
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

    // Get user's businesses
    let businessesQuery = supabaseAdmin
      .from("businesses")
      .select("id, name, google_place_id")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (business_id) {
      businessesQuery = businessesQuery.eq("id", business_id);
    }

    const { data: businesses, error: bizError } = await businessesQuery;

    if (bizError || !businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No businesses to sync", posts_synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sync-gmb-posts] Syncing posts for ${businesses.length} businesses`);

    // Get Google accounts
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!accountsResponse.ok) {
      console.error("[sync-gmb-posts] Failed to fetch accounts:", accountsResponse.status);
      throw new Error("Failed to fetch Google accounts");
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];

    let totalPostsSynced = 0;

    for (const business of businesses) {
      if (!business.google_place_id) continue;

      // Find the location in Google accounts
      for (const account of accounts) {
        const accountId = account.name; // accounts/{accountId}

        try {
          // Fetch posts using v4 API
          const postsUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${business.google_place_id}/localPosts`;
          console.log(`[sync-gmb-posts] Fetching posts from: ${postsUrl}`);

          const postsResponse = await fetch(postsUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!postsResponse.ok) {
            // Try alternative format
            const altPostsUrl = `https://mybusiness.googleapis.com/v4/accounts/${account.name.split('/')[1]}/locations/${business.google_place_id}/localPosts`;
            const altResponse = await fetch(altPostsUrl, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!altResponse.ok) {
              console.log(`[sync-gmb-posts] No posts found for ${business.name}: ${altResponse.status}`);
              continue;
            }

            const altData = await altResponse.json();
            const posts = altData.localPosts || [];
            
            if (posts.length > 0) {
              await syncPostsToDb(supabaseAdmin, userId, business.id, posts);
              totalPostsSynced += posts.length;
            }
            continue;
          }

          const postsData = await postsResponse.json();
          const posts = postsData.localPosts || [];

          console.log(`[sync-gmb-posts] Found ${posts.length} posts for ${business.name}`);

          if (posts.length > 0) {
            await syncPostsToDb(supabaseAdmin, userId, business.id, posts);
            totalPostsSynced += posts.length;
          }
        } catch (e) {
          console.error(`[sync-gmb-posts] Error fetching posts for ${business.name}:`, e);
        }
      }
    }

    console.log(`[sync-gmb-posts] Total posts synced: ${totalPostsSynced}`);

    return new Response(
      JSON.stringify({
        success: true,
        posts_synced: totalPostsSynced,
        businesses_processed: businesses.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-gmb-posts] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function syncPostsToDb(
  supabase: any,
  userId: string,
  businessId: string,
  posts: any[]
) {
  const postsData = posts.map((post) => ({
    user_id: userId,
    business_id: businessId,
    google_post_id: post.name, // Full resource name
    topic_type: post.topicType || "STANDARD",
    summary: post.summary || "",
    cta_type: post.callToAction?.actionType || null,
    cta_url: post.callToAction?.url || null,
    media_url: post.media?.[0]?.sourceUrl || null,
    posted_at: post.createTime || null,
    status: "synced",
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("gmb_posts")
    .upsert(postsData, {
      onConflict: "google_post_id",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("[sync-gmb-posts] Error upserting posts:", error);
    throw error;
  }
}
