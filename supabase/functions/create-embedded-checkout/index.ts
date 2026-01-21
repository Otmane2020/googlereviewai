import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs mapping
const PRICE_IDS = {
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
};

// Plans that get a free trial (only Starter)
const TRIAL_PLANS = ["starter_monthly", "starter_yearly"];
const TRIAL_DAYS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[create-embedded-checkout] Function started");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("[create-embedded-checkout] Env check:", {
      hasStripeKey: !!stripeKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });

    const stripe = new Stripe(stripeKey || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    console.log("[create-embedded-checkout] Auth header present:", !!authHeader);
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[create-embedded-checkout] No valid auth header");
      throw new Error("Unauthorized");
    }

    const supabaseClient = createClient(
      supabaseUrl ?? "",
      serviceRoleKey ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    console.log("[create-embedded-checkout] Validating token...");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) {
      console.error("[create-embedded-checkout] Auth error:", userError.message);
      throw new Error("Unauthorized");
    }
    
    if (!userData.user) {
      console.error("[create-embedded-checkout] No user found");
      throw new Error("Unauthorized");
    }

    const user = userData.user;
    console.log("[create-embedded-checkout] User authenticated:", user.id);

    const { priceKey } = await req.json();

    if (!priceKey || !PRICE_IDS[priceKey as keyof typeof PRICE_IDS]) {
      throw new Error("Invalid price key");
    }

    const priceId = PRICE_IDS[priceKey as keyof typeof PRICE_IDS];
    const origin = req.headers.get("origin") || "https://starlinko.app";

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
    const hasTrial = TRIAL_PLANS.includes(priceKey) && !skipTrial;

    // Create checkout session for embedded checkout
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        supabase_user_id: user.id,
        price_key: priceKey,
      },
    };

    // Add trial period for Starter plan only
    if (hasTrial) {
      sessionParams.subscription_data = {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          supabase_user_id: user.id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("[create-embedded-checkout] Session created:", session.id);

    return new Response(JSON.stringify({ 
      clientSecret: session.client_secret,
      sessionId: session.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating embedded checkout session:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
