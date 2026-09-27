import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PLAY_PACKAGE_NAME, syncPlaySubscription } from "../_shared/googlePlay.ts";

// Google Play Real-time Developer Notifications (Cloud Pub/Sub push).
// Push endpoint: https://<project>.supabase.co/functions/v1/play-rtdn-webhook?token=<PLAY_RTDN_SECRET>

// https://developer.android.com/google/play/billing/rtdn-reference#sub
const REFILL_CREDITS = new Set([
  1, // SUBSCRIPTION_RECOVERED
  2, // SUBSCRIPTION_RENEWED
  4, // SUBSCRIPTION_PURCHASED
  7, // SUBSCRIPTION_RESTARTED
]);

serve(async (req) => {
  const secret = Deno.env.get("PLAY_RTDN_SECRET");
  if (!secret || new URL(req.url).searchParams.get("token") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    const data = JSON.parse(atob(body?.message?.data ?? ""));

    if (data.packageName !== PLAY_PACKAGE_NAME) {
      return new Response("Ignored", { status: 200 });
    }

    const notification = data.subscriptionNotification;
    if (!notification?.purchaseToken) {
      // Test notifications and one-time product events need no action:
      // credit packs are redeemed synchronously by verify-play-purchase.
      return new Response("OK", { status: 200 });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: purchase } = await supabaseAdmin
      .from("play_purchases")
      .select("user_id")
      .eq("purchase_token", notification.purchaseToken)
      .maybeSingle();

    if (!purchase) {
      // Purchase not verified by the app yet: verify-play-purchase will link it.
      console.log("[play-rtdn-webhook] Unknown token, type", notification.notificationType);
      return new Response("OK", { status: 200 });
    }

    // A brand-new purchase is already credited by verify-play-purchase.
    const refill = REFILL_CREDITS.has(notification.notificationType) && notification.notificationType !== 4;
    const result = await syncPlaySubscription(supabaseAdmin, purchase.user_id, notification.purchaseToken, refill);
    console.log("[play-rtdn-webhook]", notification.notificationType, result);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[play-rtdn-webhook]", error);
    // Non-2xx makes Pub/Sub retry later.
    return new Response("Error", { status: 500 });
  }
});
