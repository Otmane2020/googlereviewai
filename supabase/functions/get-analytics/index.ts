import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "benyahya.otmane@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to read analytics
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7");
    const limit = parseInt(url.searchParams.get("limit") || "1000");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all analytics data
    const { data: analytics, error } = await supabase
      .from("visitor_analytics")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate stats
    const uniqueVisitors = new Set(analytics?.map(a => a.visitor_id) || []).size;
    const totalPageViews = analytics?.length || 0;

    // Page breakdown
    const pageBreakdown: Record<string, number> = {};
    analytics?.forEach(a => {
      pageBreakdown[a.page] = (pageBreakdown[a.page] || 0) + 1;
    });

    // UTM breakdown
    const utmBreakdown: Record<string, number> = {};
    analytics?.forEach(a => {
      if (a.utm_source) {
        const key = `${a.utm_source}/${a.utm_medium || "direct"}`;
        utmBreakdown[key] = (utmBreakdown[key] || 0) + 1;
      }
    });

    // Referrer breakdown
    const referrerBreakdown: Record<string, number> = {};
    analytics?.forEach(a => {
      if (a.referrer && a.referrer !== "direct") {
        try {
          const domain = new URL(a.referrer).hostname;
          referrerBreakdown[domain] = (referrerBreakdown[domain] || 0) + 1;
        } catch {
          referrerBreakdown["Unknown"] = (referrerBreakdown["Unknown"] || 0) + 1;
        }
      } else {
        referrerBreakdown["Direct"] = (referrerBreakdown["Direct"] || 0) + 1;
      }
    });

    // Daily breakdown
    const dailyBreakdown: Record<string, { views: number; visitors: Set<string> }> = {};
    analytics?.forEach(a => {
      const day = a.created_at.split("T")[0];
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = { views: 0, visitors: new Set() };
      }
      dailyBreakdown[day].views++;
      dailyBreakdown[day].visitors.add(a.visitor_id);
    });

    const dailyStats = Object.entries(dailyBreakdown).map(([date, data]) => ({
      date,
      views: data.views,
      visitors: data.visitors.size
    })).sort((a, b) => a.date.localeCompare(b.date));

    return new Response(
      JSON.stringify({
        stats: {
          uniqueVisitors,
          totalPageViews,
          days
        },
        pageBreakdown,
        utmBreakdown,
        referrerBreakdown,
        dailyStats,
        recentSessions: analytics?.slice(0, 50) || []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
