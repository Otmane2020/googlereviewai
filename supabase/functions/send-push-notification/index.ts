import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function shouldDeleteSubscription(status?: number, errorText?: string): boolean {
  if (status === 404 || status === 410) return true;
  const msg = (errorText || "").toLowerCase();
  return msg.includes("expired") || msg.includes("unsubscribed") || msg.includes("not found");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("[send-push] VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-push] VAPID public key length:", vapidPublicKey.length);
    console.log("[send-push] VAPID private key length:", vapidPrivateKey.length);

    // Configure web-push with VAPID details
    webpush.setVapidDetails(
      "mailto:contact@starlinko.app",
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, icon, url, data } = await req.json();
    console.log("[send-push] Request for user:", user_id, "title:", title);

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or title" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("[send-push] Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[send-push] No push subscriptions for user ${user_id}`);
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-push] Found ${subscriptions.length} subscription(s)`);

    const notificationPayload = JSON.stringify({
      title,
      body: body || "",
      icon: icon || "/icon-512x512.png",
      url: url || "/reviews",
      ...data,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      if (sub.p256dh === "fcm") {
        console.log(`[send-push] Skipping legacy FCM token`);
        failed++;
        continue;
      }

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        console.log(`[send-push] Sending to endpoint: ${sub.endpoint.substring(0, 60)}...`);
        await webpush.sendNotification(pushSubscription, notificationPayload, {
          TTL: 86400,
          urgency: "high",
        });
        sent++;
        console.log(`[send-push] ✅ Sent successfully`);
      } catch (error: any) {
        failed++;
        console.error(`[send-push] ❌ Error:`, error.statusCode, error.body || error.message);
        
        if (shouldDeleteSubscription(error.statusCode, error.body || error.message)) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`[send-push] Removed expired subscription`);
        }
      }
    }

    console.log(`[send-push] Result: ${sent} sent, ${failed} failed for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-push] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
