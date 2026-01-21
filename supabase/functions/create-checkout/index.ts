import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs mapping
const PRICE_IDS: Record<string, string> = {
  // Monthly plans
  starter_monthly: "price_1SrHtCEfti9t9nN9L8Fytsni",
  pro_monthly: "price_1SrHtDEfti9t9nN96yIPGiOo",
  business_monthly: "price_1SrHtEEfti9t9nN9mq7MrV3G",
  aeo_monthly: "price_1SrHtHEfti9t9nN9Me70ucqf",
  seo_monthly: "price_1SrHtIEfti9t9nN9qfdPvSY5",
  // Yearly plans (-20%)
  starter_yearly: "price_1SrHtOEfti9t9nN9fG4lSroa",
  pro_yearly: "price_1SrHtPEfti9t9nN9dnZ0sXpi",
  business_yearly: "price_1SrHtQEfti9t9nN9GKvr4NSt",
  aeo_yearly: "price_1SrHtSEfti9t9nN9t5NgA002",
  seo_yearly: "price_1SrHtSEfti9t9nN9rXMfteyT",
  // Credit packs (one-time purchases)
  credits_100: "price_credits_100",
  credits_1000: "price_credits_1000",
  credits_3500: "price_credits_3500",
  credits_7000: "price_credits_7000",
  credits_10000: "price_credits_10000",
  credits_17000: "price_credits_17000",
  credits_35000: "price_credits_35000",
  credits_70000: "price_credits_70000",
  credits_100000: "price_credits_100000",
};

// Credit amounts for each pack
const CREDIT_AMOUNTS: Record<string, number> = {
  credits_100: 100,
  credits_1000: 1000,
  credits_3500: 3500,
  credits_7000: 7000,
  credits_10000: 10000,
  credits_17000: 17000,
  credits_35000: 35000,
  credits_70000: 70000,
  credits_100000: 100000,
};

// Plans that get a free trial (only Starter)
const TRIAL_PLANS = ["starter_monthly", "starter_yearly"];
const TRIAL_DAYS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { priceKey, successUrl, cancelUrl, mode } = await req.json();

    if (!priceKey || !PRICE_IDS[priceKey]) {
      throw new Error("Invalid price key");
    }

    const priceId = PRICE_IDS[priceKey];
    const isCreditsPackage = priceKey.startsWith("credits_");
    const checkoutMode = isCreditsPackage || mode === "payment" ? "payment" : "subscription";

    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    let skipTrial = false;

    if (customers.data.length > 0) {
      const existingCustomer = customers.data[0];
      
      // Check customer's currency from existing subscriptions/invoices
      const subscriptions = await stripe.subscriptions.list({
        customer: existingCustomer.id,
        status: "all",
        limit: 10,
      });

      // Check if customer has subscriptions with different currency (USD vs EUR)
      const hasUsdSubscriptions = subscriptions.data.some((sub: Stripe.Subscription) => 
        sub.currency === "usd"
      );

      // If customer has USD subscriptions and we're trying to use EUR prices, create new customer
      if (hasUsdSubscriptions) {
        console.log("Customer has USD subscriptions, creating new customer for EUR prices");
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
            currency: "eur",
          },
        });
        customerId = newCustomer.id;
      } else {
        customerId = existingCustomer.id;
        
        // Check if customer already had a trial
        const hadTrial = subscriptions.data.some((sub: Stripe.Subscription) => sub.trial_end !== null);
        
        // If customer already had a trial, don't offer another one
        if (hadTrial && TRIAL_PLANS.includes(priceKey)) {
          skipTrial = true;
        }
      }
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Determine if this plan gets a free trial
    const hasTrial = TRIAL_PLANS.includes(priceKey);

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: checkoutMode,
      success_url: successUrl || `${req.headers.get("origin")}/dashboard?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/dashboard?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        price_key: priceKey,
        ...(isCreditsPackage && { credits_amount: String(CREDIT_AMOUNTS[priceKey] || 0) }),
      },
    };

    // Add trial period for Starter plan only (if not skipped) - only for subscriptions
    if (checkoutMode === "subscription" && hasTrial && !skipTrial) {
      sessionParams.subscription_data = {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          supabase_user_id: user.id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating checkout session:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
