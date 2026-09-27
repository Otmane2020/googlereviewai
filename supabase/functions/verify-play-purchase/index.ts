import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  PLAY_CREDIT_PACKS,
  PLAY_SUBSCRIPTIONS,
  redeemPlayCreditPack,
  syncPlaySubscription,
} from "../_shared/googlePlay.ts";

// Called by the Android app (TWA) after a Google Play Billing purchase.
// The website keeps using Stripe (create-checkout / stripe-webhook).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const { sku, purchaseToken } = await req.json();
    if (typeof sku !== "string" || typeof purchaseToken !== "string" || !purchaseToken) {
      return json({ error: "sku and purchaseToken are required" }, 400);
    }

    // A purchase token belongs to exactly one account.
    const { data: existing } = await supabaseAdmin
      .from("play_purchases")
      .select("user_id")
      .eq("purchase_token", purchaseToken)
      .maybeSingle();
    if (existing && existing.user_id !== user.id) {
      return json({ error: "Purchase already linked to another account" }, 409);
    }

    if (PLAY_SUBSCRIPTIONS[sku]) {
      const result = await syncPlaySubscription(supabaseAdmin, user.id, purchaseToken, !existing);
      if (result.productId !== sku) return json({ error: "Product mismatch" }, 400);
      return json({ success: result.active, kind: "subscription", ...result });
    }

    if (PLAY_CREDIT_PACKS[sku]) {
      const result = await redeemPlayCreditPack(supabaseAdmin, user.id, sku, purchaseToken);
      return json({ success: true, kind: "product", ...result });
    }

    return json({ error: `Unknown product: ${sku}` }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[verify-play-purchase]", message);
    return json({ error: message }, 500);
  }
});
