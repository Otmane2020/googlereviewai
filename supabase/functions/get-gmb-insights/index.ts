import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google OAuth token refresh helper
async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .eq("id", userId)
    .single();

  if (!profile?.google_refresh_token) {
    console.log("[GMB Insights] No refresh token available");
    return null;
  }

  // Check if current token is still valid (with 5 min buffer)
  const expiresAt = profile.google_token_expires_at ? new Date(profile.google_token_expires_at) : null;
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);

  if (profile.google_access_token && expiresAt && expiresAt > now) {
    console.log("[GMB Insights] Using existing valid access token");
    return profile.google_access_token;
  }

  // Refresh the token
  console.log("[GMB Insights] Refreshing access token");
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error("[GMB Insights] Token refresh failed:", tokenData);
    return null;
  }

  // Save the new token
  const newExpiresAt = new Date();
  newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (tokenData.expires_in || 3600));

  await supabase
    .from("profiles")
    .update({
      google_access_token: tokenData.access_token,
      google_token_expires_at: newExpiresAt.toISOString(),
    })
    .eq("id", userId);

  return tokenData.access_token;
}

// Fetch a single metric from Google Business Profile Performance API
async function fetchMetric(
  accessToken: string,
  locationId: string,
  metric: string,
  startDate: { year: number; month: number; day: number },
  endDate: { year: number; month: number; day: number }
): Promise<number> {
  const url = new URL(
    `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:getDailyMetricsTimeSeries`
  );
  url.searchParams.set("dailyMetric", metric);
  url.searchParams.set("dailyRange.startDate.year", startDate.year.toString());
  url.searchParams.set("dailyRange.startDate.month", startDate.month.toString());
  url.searchParams.set("dailyRange.startDate.day", startDate.day.toString());
  url.searchParams.set("dailyRange.endDate.year", endDate.year.toString());
  url.searchParams.set("dailyRange.endDate.month", endDate.month.toString());
  url.searchParams.set("dailyRange.endDate.day", endDate.day.toString());

  console.log(`[GMB Insights] Fetching ${metric} for location ${locationId}`);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GMB Insights] Error fetching ${metric}:`, response.status, errorText);
    return 0;
  }

  const data = await response.json();
  
  // Sum up all daily values
  let total = 0;
  if (data.timeSeries?.datedValues) {
    for (const dv of data.timeSeries.datedValues) {
      total += parseInt(dv.value || "0", 10);
    }
  }

  console.log(`[GMB Insights] ${metric}: ${total}`);
  return total;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request params
    const { business_id, days = 30 } = await req.json().catch(() => ({}));

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          error: "No Google token", 
          requires_reconnect: true,
          insights: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get businesses
    let businessQuery = supabase
      .from("businesses")
      .select("id, name, google_place_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (business_id) {
      businessQuery = businessQuery.eq("id", business_id);
    }

    const { data: businesses, error: bizError } = await businessQuery;

    if (bizError || !businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No businesses found",
          insights: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const start = {
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      day: startDate.getDate(),
    };
    const end = {
      year: endDate.getFullYear(),
      month: endDate.getMonth() + 1,
      day: endDate.getDate(),
    };

    // Metrics to fetch
    const metrics = [
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "WEBSITE_CLICKS",
      "CALL_CLICKS",
      "BUSINESS_DIRECTION_REQUESTS",
      "BUSINESS_BOOKINGS",
      "BUSINESS_CONVERSATIONS",
      "BUSINESS_FOOD_ORDERS",
    ];

    // Aggregate metrics across all businesses
    const totals: Record<string, number> = {};
    for (const metric of metrics) {
      totals[metric] = 0;
    }

    for (const business of businesses) {
      if (!business.google_place_id) continue;

      for (const metric of metrics) {
        try {
          const value = await fetchMetric(
            accessToken,
            business.google_place_id,
            metric,
            start,
            end
          );
          totals[metric] += value;
        } catch (e) {
          console.error(`[GMB Insights] Error fetching ${metric} for ${business.name}:`, e);
        }
      }
    }

    // Calculate combined impressions
    const profileViews = 
      totals.BUSINESS_IMPRESSIONS_DESKTOP_MAPS +
      totals.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH +
      totals.BUSINESS_IMPRESSIONS_MOBILE_MAPS +
      totals.BUSINESS_IMPRESSIONS_MOBILE_SEARCH;

    const insights = {
      profileViews,
      websiteClicks: totals.WEBSITE_CLICKS,
      phoneCalls: totals.CALL_CLICKS,
      directionRequests: totals.BUSINESS_DIRECTION_REQUESTS,
      bookings: totals.BUSINESS_BOOKINGS,
      conversations: totals.BUSINESS_CONVERSATIONS,
      foodOrders: totals.BUSINESS_FOOD_ORDERS,
      period: `${days} jours`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      businessCount: businesses.filter(b => b.google_place_id).length,
    };

    console.log("[GMB Insights] Final insights:", insights);

    return new Response(
      JSON.stringify({ success: true, insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[GMB Insights] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
