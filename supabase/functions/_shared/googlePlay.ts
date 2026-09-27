/**
 * Google Play Billing helpers (Android app only — the website keeps Stripe).
 *
 * Required secrets:
 * - GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: JSON key of a Google Cloud service
 *   account invited in Play Console with "View financial data" and
 *   "Manage orders and subscriptions" permissions.
 * - GOOGLE_PLAY_PACKAGE_NAME (optional, defaults to com.googlereviewai.app)
 */

export const PLAY_PACKAGE_NAME = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME") ?? "com.googlereviewai.app";

// Play subscription product IDs reuse the Stripe price keys. Each product
// has a single auto-renewing base plan (monthly or yearly).
export const PLAY_SUBSCRIPTIONS: Record<string, { credits: number; maxBusinesses: number; planName: string; billingCycle: "month" | "year" }> = {
  ranki_starter_monthly: { credits: 50, maxBusinesses: 1, planName: "Starter", billingCycle: "month" },
  ranki_starter_yearly: { credits: 50, maxBusinesses: 1, planName: "Starter Annuel", billingCycle: "year" },
  ranki_pro_monthly: { credits: 300, maxBusinesses: 3, planName: "Pro", billingCycle: "month" },
  ranki_pro_yearly: { credits: 300, maxBusinesses: 3, planName: "Pro Annuel", billingCycle: "year" },
  ranki_business_monthly: { credits: 1000, maxBusinesses: 999, planName: "Business", billingCycle: "month" },
  ranki_business_yearly: { credits: 1000, maxBusinesses: 999, planName: "Business Annuel", billingCycle: "year" },
};

// Consumable in-app products (credit packs), same keys as the Stripe packs.
export const PLAY_CREDIT_PACKS: Record<string, number> = {
  credits_10: 10,
  credits_100: 100,
  credits_330: 330,
  credits_660: 660,
  credits_1000: 1000,
};

const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PLAY_PACKAGE_NAME}`;

const base64url = (input: ArrayBuffer | string) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const raw = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured");
  const sa = JSON.parse(raw) as { client_email: string; private_key: string };

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${base64url(signature)}`,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Google OAuth error: ${JSON.stringify(json)}`);
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.token;
}

async function playApi(path: string, method: "GET" | "POST" = "GET") {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Play API ${method} ${path} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

const ACTIVE_STATES = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
  // Auto-renew turned off: access continues until expiryTime.
  "SUBSCRIPTION_STATE_CANCELED",
]);

/**
 * Fetches a Play subscription, mirrors it on the user's profile and
 * acknowledges it. `refillCredits` resets the monthly credits (new purchase
 * or renewal), like invoice.payment_succeeded does for Stripe.
 */
// deno-lint-ignore no-explicit-any
export async function syncPlaySubscription(supabaseAdmin: any, userId: string, purchaseToken: string, refillCredits: boolean) {
  const sub = await playApi(`/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`);
  const lineItem = sub.lineItems?.[0];
  const productId: string | undefined = lineItem?.productId;
  const config = productId ? PLAY_SUBSCRIPTIONS[productId] : undefined;
  if (!productId || !config) throw new Error(`Unknown Play subscription product: ${productId}`);

  const state: string = sub.subscriptionState;
  const expiryTime: string | null = lineItem?.expiryTime ?? null;
  const active = ACTIVE_STATES.has(state) && (!expiryTime || new Date(expiryTime).getTime() > Date.now());

  await supabaseAdmin.from("play_purchases").upsert({
    purchase_token: purchaseToken,
    user_id: userId,
    product_id: productId,
    kind: "subscription",
    state,
    expiry_time: expiryTime,
    updated_at: new Date().toISOString(),
  });

  if (active) {
    const update: Record<string, unknown> = {
      plan_name: config.planName,
      plan_id: `play:${productId}`,
      max_businesses: config.maxBusinesses,
      subscription_status: "active",
      current_period_end: expiryTime,
      billing_cycle: config.billingCycle,
    };
    if (refillCredits) update.credits = config.credits;
    const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", userId);
    if (error) throw error;
  } else if (state !== "SUBSCRIPTION_STATE_PENDING") {
    // Only clear the plan if it is still this Play subscription (the user may
    // have subscribed again, on Play or on the website with Stripe).
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        plan_name: null,
        plan_id: null,
        subscription_status: "canceled",
        credits: 0,
        max_businesses: 1,
        current_period_end: expiryTime,
      })
      .eq("id", userId)
      .eq("plan_id", `play:${productId}`);
    if (error) throw error;
  }

  if (sub.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING" && active) {
    await playApi(`/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, "POST");
  }

  return { productId, state, active, expiryTime };
}

/** Verifies, credits and consumes a one-time credit pack purchase. */
// deno-lint-ignore no-explicit-any
export async function redeemPlayCreditPack(supabaseAdmin: any, userId: string, productId: string, purchaseToken: string) {
  const credits = PLAY_CREDIT_PACKS[productId];
  if (!credits) throw new Error(`Unknown Play credit pack: ${productId}`);

  const purchase = await playApi(`/purchases/products/${productId}/tokens/${encodeURIComponent(purchaseToken)}`);
  if (purchase.purchaseState !== 0) throw new Error("Purchase is not completed");

  // The primary key on purchase_token makes redemption idempotent.
  const { error: insertError } = await supabaseAdmin.from("play_purchases").insert({
    purchase_token: purchaseToken,
    user_id: userId,
    product_id: productId,
    kind: "product",
    state: "PURCHASED",
  });
  const alreadyRedeemed = insertError?.code === "23505";
  if (insertError && !alreadyRedeemed) throw insertError;
  if (alreadyRedeemed) {
    const { data: existing } = await supabaseAdmin
      .from("play_purchases").select("user_id").eq("purchase_token", purchaseToken).single();
    if (existing?.user_id !== userId) throw new Error("Purchase already used by another account");
  }

  if (!alreadyRedeemed) {
    try {
      const { data: profile, error } = await supabaseAdmin.from("profiles").select("credits").eq("id", userId).single();
      if (error) throw error;
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ credits: (profile?.credits ?? 0) + credits })
        .eq("id", userId);
      if (updateError) throw updateError;
    } catch (e) {
      // Let the client retry: the pack is not consumed and not marked redeemed.
      await supabaseAdmin.from("play_purchases").delete().eq("purchase_token", purchaseToken);
      throw e;
    }
  }

  if (purchase.consumptionState === 0) {
    await playApi(`/purchases/products/${productId}/tokens/${encodeURIComponent(purchaseToken)}:consume`, "POST");
  }

  return { credits, alreadyRedeemed };
}
