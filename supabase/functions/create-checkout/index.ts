import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Price IDs mapping
const PRICE_IDS: Record<string, string> = {
  // ===== NEW Reviews AI plans (June 2026) =====
  ranki_starter_monthly: "price_1TjxSJEfti9t9nN9XgMVswCh",  // 9.99€/mo
  ranki_starter_yearly:  "price_1TjxSJEfti9t9nN91VDBOxZX",  // 95.90€/yr (-20%)
  ranki_pro_monthly:     "price_1TjxSKEfti9t9nN9HAzRfqz8",  // 49€/mo
  ranki_pro_yearly:      "price_1TjxSKEfti9t9nN9iv48DJvm",  // 470€/yr (-20%)
  ranki_business_monthly:"price_1TjxSLEfti9t9nN9DqcufGNo",  // 99€/mo
  ranki_business_yearly: "price_1TjxSLEfti9t9nN9GrF6F0Pw",  // 950.40€/yr (-20%)
  // USD prices on the SAME current products as the 2026 EUR plans:
  ranki_starter_monthly_usd: "price_1UQtGKEfti9t9nN9XyTCtHYK", // $9.99/mo
  ranki_starter_yearly_usd: "price_1UQtGMEfti9t9nN973J7Avoy",  // $95.90/yr
  ranki_pro_monthly_usd: "price_1UQtGUEfti9t9nN9Fsfqwlfj",     // $49/mo
  ranki_pro_yearly_usd: "price_1UQtGWEfti9t9nN9QNQxVIYI",      // $470/yr
  ranki_business_monthly_usd: "price_1UQtGZEfti9t9nN9143Lii65", // $99/mo
  ranki_business_yearly_usd: "price_1UQtGbEfti9t9nN9cNGQpdnJ", // $950.40/yr

  // ===== Legacy aliases (keep for older clients) =====
  ranki_starter: "price_1TjxSJEfti9t9nN9XgMVswCh",
  ranki_pro: "price_1TjxSKEfti9t9nN9HAzRfqz8",
  ranki_business: "price_1TjxSLEfti9t9nN9DqcufGNo",

  // USD plans (legacy)
  starter_monthly: "price_1TSa8oEfti9t9nN9RCi6cW8y",
  growth_monthly: "price_1TSa8pEfti9t9nN9JHI4owg3",
  agency_monthly: "price_1TSa8rEfti9t9nN9c1Cr3THW",
  agency_eu_monthly: "price_1TTuIpEfti9t9nN9sy6pUNgU",
  // Legacy EUR plans
  pro_monthly: "price_1SrHtDEfti9t9nN96yIPGiOo",
  business_monthly: "price_1SrHtEEfti9t9nN9mq7MrV3G",
  aeo_monthly: "price_1SsBcUEfti9t9nN9aqWMiw7Y",
  seo_monthly: "price_1SrHtIEfti9t9nN9qfdPvSY5",
  allinone_monthly: "price_1SxGZgEfti9t9nN9txGIyk7j",
  starter_yearly: "price_1SrHtOEfti9t9nN9fG4lSroa",
  pro_yearly: "price_1SrHtPEfti9t9nN9dnZ0sXpi",
  business_yearly: "price_1SrHtQEfti9t9nN9GKvr4NSt",
  aeo_yearly: "price_1SsBcVEfti9t9nN9oFgHq9x8",
  seo_yearly: "price_1SrHtSEfti9t9nN9rXMfteyT",
  allinone_yearly: "price_1SxGZxEfti9t9nN97rkyb8F1",
  daily_monthly: "price_1TU9QcEfti9t9nN9MwGBzftO",
  daily_monthly_eur: "price_1TU9QcEfti9t9nN9MwGBzftO",
  daily_monthly_usd: "price_1TU9PkEfti9t9nN9gSl8RirX",
  // Credit packs
  credits_10: "price_1SrrYEEfti9t9nN9N8l9AaA1",
  credits_100: "price_1SrrYFEfti9t9nN9Y4zxBb3p",
  credits_330: "price_1SrrYGEfti9t9nN9z01pdk3y",
  credits_660: "price_1SrrYIEfti9t9nN9q8NplGxN",
  credits_1000: "price_1SrrYJEfti9t9nN9Bv7IhpUP",
  credits_1660: "price_1SrrYKEfti9t9nN920sUpYws",
  credits_3330: "price_1SrrYMEfti9t9nN9fqqz5xfd",
  credits_6660: "price_1SrrYNEfti9t9nN9deRwwVI3",
  credits_10000: "price_1SrrYOEfti9t9nN9TxSVXmcs",
};


// Credit amounts for each pack
const CREDIT_AMOUNTS: Record<string, number> = {
  credits_10: 10,
  credits_100: 100,
  credits_330: 330,
  credits_660: 660,
  credits_1000: 1000,
  credits_1660: 1660,
  credits_3330: 3330,
  credits_6660: 6660,
  credits_10000: 10000,
};

// Reviews AI plans charge immediately: no 7-day free trial.
// Preserve the separate, legacy all-in-one yearly offer below.
// All-in-one yearly gets 60 days trial (2 months free)
const ALLINONE_YEARLY_TRIAL_DAYS = 60;

// Per-business pricing modules (49€/establishment)
const PER_BUSINESS_MODULES = ["aeo_monthly", "aeo_yearly", "seo_monthly", "seo_yearly"];

// Subscription price keys (recurring)
const SUBSCRIPTION_PRICE_KEYS = [
  "ranki_starter", "ranki_pro", "ranki_business",
  "ranki_starter_monthly", "ranki_starter_yearly",
  "ranki_pro_monthly", "ranki_pro_yearly",
  "ranki_business_monthly", "ranki_business_yearly",
  "ranki_starter_monthly_usd", "ranki_starter_yearly_usd",
  "ranki_pro_monthly_usd", "ranki_pro_yearly_usd",
  "ranki_business_monthly_usd", "ranki_business_yearly_usd",
  "starter_monthly", "starter_yearly",
  "growth_monthly", "agency_monthly", "agency_eu_monthly",
  "pro_monthly", "pro_yearly",
  "business_monthly", "business_yearly",
  "aeo_monthly", "aeo_yearly",
  "seo_monthly", "seo_yearly",
  "allinone_monthly", "allinone_yearly",
  "daily_monthly", "daily_monthly_eur", "daily_monthly_usd",
];


interface CartItem {
  priceKey: string;
  quantity: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
    if (!stripeKey || !/^(sk|rk)_(test|live)_/.test(stripeKey)) {
      return new Response(JSON.stringify({
        error: "Stripe n'est pas configuré pour les paiements. Ajoutez STRIPE_SECRET_KEY dans Lovable Cloud / Supabase Edge Functions Secrets.",
        code: "STRIPE_NOT_CONFIGURED",
      }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+/i.test(authHeader)) {
      return new Response(JSON.stringify({ error: "Please sign in to continue.", code: "AUTH_REQUIRED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Session expired. Please sign in again.", code: "AUTH_EXPIRED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    
    // Support both old single-item format and new cart format
    let items: CartItem[] = [];
    
    if (body.items && Array.isArray(body.items)) {
      // New cart format: { items: [{ priceKey, quantity }, ...] }
      items = body.items;
    } else if (body.priceKey) {
      // Old single-item format: { priceKey, quantity, ... }
      items = [{ priceKey: body.priceKey, quantity: body.quantity || 1 }];
    } else {
      throw new Error("Invalid request: items or priceKey required");
    }

    const { successUrl, cancelUrl } = body;

    // Accept only server-side catalog keys and safe integer quantities.
    // Never accept raw Stripe price IDs or amounts supplied by the browser.
    if (items.length < 1 || items.length > 20) {
      throw new Error("Invalid cart size");
    }
    for (const item of items) {
      if (!item || typeof item.priceKey !== "string" || !Object.hasOwn(PRICE_IDS, item.priceKey)) {
        throw new Error("Invalid price key");
      }
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        throw new Error("Invalid quantity (1 to 10)");
      }
    }

    // Separate subscription items from one-time items
    const subscriptionItems = items.filter(item => SUBSCRIPTION_PRICE_KEYS.includes(item.priceKey));
    const oneTimeItems = items.filter(item => !SUBSCRIPTION_PRICE_KEYS.includes(item.priceKey));

    // Determine checkout mode
    const hasSubscriptions = subscriptionItems.length > 0;
    const hasOneTime = oneTimeItems.length > 0;

    // Stripe doesn't allow mixing subscription and payment modes in one session
    // If we have both, we'll create a subscription and add one-time items as invoice items
    if (hasSubscriptions && hasOneTime) {
      throw new Error("Subscription plans and one-time credit packs require separate checkouts.");
    }
    const checkoutMode = hasSubscriptions ? "subscription" : "payment";

    console.log(`[create-checkout] Mode: ${checkoutMode}, Subscription items: ${subscriptionItems.length}, One-time items: ${oneTimeItems.length}`);

    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    let skipTrial = false;

    if (customers.data.length > 0) {
      const existingCustomer = customers.data[0];
      console.log(`[create-checkout] Found existing Stripe customer: ${existingCustomer.id}`);
      
      // Check customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: existingCustomer.id,
        status: "all",
        limit: 10,
      });

      console.log(`[create-checkout] Customer has ${subscriptions.data.length} subscriptions`);

      // Check if customer has ACTIVE subscriptions (not canceled/incomplete)
      const hasActiveSubscription = subscriptions.data.some((sub: Stripe.Subscription) => 
        ["active", "trialing", "past_due"].includes(sub.status)
      );

      // Check if customer has subscriptions with different currency (USD vs EUR)
      const hasUsdSubscriptions = subscriptions.data.some((sub: Stripe.Subscription) => 
        sub.currency === "usd"
      );

      if (hasUsdSubscriptions && !subscriptionItems.some(item => item.priceKey.endsWith("_usd"))) {
        console.log("[create-checkout] Customer has USD subscriptions, creating a distinct EUR customer");
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
            currency: "eur",
          },
        });
        customerId = newCustomer.id;
      } else if (hasActiveSubscription) {
        // Customer already has an active subscription - this shouldn't happen normally
        // but we handle it gracefully
        console.log("[create-checkout] Customer already has active subscription, using existing customer");
        customerId = existingCustomer.id;
        skipTrial = true; // No trial if they already have an active sub
      } else {
        // Customer exists but has NO active subscription (canceled, expired, deleted user re-created, etc.)
        // They can create a new subscription normally
        customerId = existingCustomer.id;
        console.log("[create-checkout] Existing customer with no active subscription, allowing new checkout");
        
        // Check if customer already had a trial on a COMPLETED subscription (not just any trial)
        const hadCompletedTrialSubscription = subscriptions.data.some((sub: Stripe.Subscription) => 
          sub.trial_end !== null && ["canceled", "ended"].includes(sub.status)
        );
        
        if (hadCompletedTrialSubscription) {
          console.log("[create-checkout] Customer already used trial, skipping trial for new subscription");
          skipTrial = true;
        }
      }
    } else {
      console.log("[create-checkout] No existing customer found, creating new one");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    if (checkoutMode === "subscription") {
      // Add subscription items
      for (const item of subscriptionItems) {
        const priceId = PRICE_IDS[item.priceKey];
        const quantity = PER_BUSINESS_MODULES.includes(item.priceKey) 
          ? Math.max(1, item.quantity) 
          : 1;
        
        lineItems.push({ price: priceId, quantity });
      }
      
      // Note: One-time items cannot be added directly to subscription checkout
      // They would need to be added as invoice items after subscription is created
      // For simplicity, we'll skip them in this session and handle separately if needed
      if (hasOneTime) {
        console.log(`[create-checkout] Warning: ${oneTimeItems.length} one-time items cannot be added to subscription checkout`);
      }
    } else {
      // Payment mode - all one-time items
      for (const item of oneTimeItems) {
        const priceId = PRICE_IDS[item.priceKey];
        lineItems.push({ price: priceId, quantity: item.quantity || 1 });
      }
    }

    // Build metadata
    const metadata: Record<string, string> = {
      supabase_user_id: user.id,
      cart_items: JSON.stringify(items.map(i => ({ priceKey: i.priceKey, quantity: i.quantity }))),
    };

    // Add credits info if applicable
    const creditItems = items.filter(item => item.priceKey.startsWith("credits_"));
    if (creditItems.length > 0) {
      const totalCredits = creditItems.reduce((sum, item) => {
        return sum + (CREDIT_AMOUNTS[item.priceKey] || 0) * item.quantity;
      }, 0);
      metadata.total_credits = String(totalCredits);
    }

    // Validate redirect destinations (prevents checkout phishing redirects).
    const callerOrigin = req.headers.get("origin") || "https://reviewsai.store";
    const safeOrigin = (() => {
      try {
        const url = new URL(callerOrigin);
        if (url.protocol === "https:" && (
          url.hostname === "reviewsai.store" ||
          url.hostname === "www.reviewsai.store" ||
          url.hostname === "starlinko.lovable.app" ||
          url.hostname.endsWith(".lovable.app")
        )) return url.origin;
      } catch { /* fall back to production */ }
      return "https://reviewsai.store";
    })();
    const sameOriginCheckoutUrl = (candidate: unknown, fallbackPath: string) => {
      if (typeof candidate !== "string" || !candidate) return safeOrigin + fallbackPath;
      try {
        const url = new URL(candidate);
        return url.origin === safeOrigin && url.protocol === "https:"
          ? url.toString() : safeOrigin + fallbackPath;
      } catch { return safeOrigin + fallbackPath; }
    };

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: lineItems,
      mode: checkoutMode,
      locale: req.headers.get("accept-language")?.toLowerCase().startsWith("fr") ? "fr" : "en",
      allow_promotion_codes: true, // Enable promo codes in checkout
      success_url: sameOriginCheckoutUrl(successUrl, "/dashboard?success=true"),
      cancel_url: sameOriginCheckoutUrl(cancelUrl, "/settings?canceled=true"),
      metadata,
    };

    // Only the separate legacy all-in-one yearly offer retains its own promotion.
    const hasAllinoneYearly = items.some(item => item.priceKey === "allinone_yearly");
    
    // Add trial period for eligible plans (if not skipped)
    if (checkoutMode === "subscription" && !skipTrial) {
      if (hasAllinoneYearly) {
        // 60 days trial for all-in-one yearly (2 months free)
        sessionParams.subscription_data = {
          trial_period_days: ALLINONE_YEARLY_TRIAL_DAYS,
          metadata: {
            supabase_user_id: user.id,
          },
        };
        console.log(`[create-checkout] Adding 60-day trial for allinone_yearly`);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      throw new Error("Stripe did not return a payment URL");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; type?: string; code?: string; requestId?: string; statusCode?: number };
    console.error("[create-checkout] Stripe/session failure:", {
      type: err?.type, code: err?.code, message: err?.message, request_id: err?.requestId,
    });
    let code = "STRIPE_CHECKOUT_FAILED";
    let message = "Stripe could not create a checkout session. Please try again.";
    let status = 502;
    if (err?.type === "StripeAuthenticationError" || err?.statusCode === 401) {
      code = "STRIPE_AUTH_FAILED";
      message = "Stripe rejected STRIPE_SECRET_KEY. Check that the key is valid and belongs to the Stripe account holding these prices.";
      status = 503;
    } else if (err?.type === "StripePermissionError" || err?.statusCode === 403) {
      code = "STRIPE_PERMISSION_DENIED";
      message = "The Stripe API key cannot create Checkout sessions. Check its account and permissions.";
      status = 503;
    } else if (err?.type === "StripeInvalidRequestError") {
      code = /no such price|price.*does not exist|inactive|currency/i.test(err.message || "")
        ? "STRIPE_PRICE_MISMATCH" : "STRIPE_INVALID_REQUEST";
      message = code === "STRIPE_PRICE_MISMATCH"
        ? "The Stripe price is not available to the connected Stripe key. Check that STRIPE_SECRET_KEY and the price IDs belong to the same account and mode."
        : "Stripe rejected the checkout configuration. Check the function logs using the request ID.";
      status = 422;
    } else if (!err?.type && err?.message) {
      code = "CHECKOUT_VALIDATION_FAILED";
      message = err.message;
      status = 400;
    }
    return new Response(JSON.stringify({
      error: message, code, request_id: err?.requestId || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status,
    });
  }
});