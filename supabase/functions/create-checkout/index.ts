import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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

    const { priceKey, successUrl, cancelUrl } = await req.json();

    if (!priceKey || !PRICE_IDS[priceKey as keyof typeof PRICE_IDS]) {
      throw new Error("Invalid price key");
    }

    const priceId = PRICE_IDS[priceKey as keyof typeof PRICE_IDS];

    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${req.headers.get("origin")}/dashboard?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/dashboard?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        price_key: priceKey,
      },
    });

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
