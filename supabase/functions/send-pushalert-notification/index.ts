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
    const pushalertApiKey = Deno.env.get("PUSHALERT_API_KEY");
    
    if (!pushalertApiKey) {
      console.error("[PushAlert] API key not configured");
      return new Response(
        JSON.stringify({ error: "PushAlert API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, title, message, url, icon } = await req.json();

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or title" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[PushAlert] Sending notification to user: ${user_id}`);
    console.log(`[PushAlert] Title: ${title}, Message: ${message?.substring(0, 50)}...`);

    // Get user email to use as subscriber identifier
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user_id)
      .maybeSingle();

    if (profileError || !profile?.email) {
      console.error("[PushAlert] Could not find user email:", profileError);
      return new Response(
        JSON.stringify({ error: "User not found", sent: 0 }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notification via PushAlert REST API
    // Using "Send to All Subscribers" endpoint as fallback, or targeted by attributes
    const pushalertUrl = "https://api.pushalert.co/rest/v1/send";
    
    const notificationPayload = {
      title: title,
      message: message || "",
      url: url || "https://starlinko.app/reviews",
      icon: icon || "https://starlinko.app/icon-512x512.png",
      // Target specific subscriber by email attribute (if set during subscription)
      // For now, we'll use broadcast and rely on segment targeting later
    };

    console.log(`[PushAlert] Sending to API:`, JSON.stringify(notificationPayload));

    const response = await fetch(pushalertUrl, {
      method: "POST",
      headers: {
        "Authorization": `api_key=${pushalertApiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        title: notificationPayload.title,
        message: notificationPayload.message,
        url: notificationPayload.url,
        icon: notificationPayload.icon,
      }).toString(),
    });

    const responseText = await response.text();
    console.log(`[PushAlert] API Response: ${response.status} - ${responseText}`);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    if (response.ok && result.success !== false) {
      console.log(`[PushAlert] ✅ Notification sent successfully`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 1,
          notification_id: result.id || result.notification_id,
          result 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error(`[PushAlert] ❌ Failed:`, result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          sent: 0,
          error: result.message || result.error || "Unknown error",
          result 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("[PushAlert] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
