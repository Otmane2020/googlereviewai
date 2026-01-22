import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs mapping for add-on modules
const MODULE_PRICE_IDS: Record<string, string> = {
  aeo_monthly: "price_1SsBcUEfti9t9nN9aqWMiw7Y",
  aeo_yearly: "price_1SsBcVEfti9t9nN9oFgHq9x8",
  seo_monthly: "price_1SrHtIEfti9t9nN9qfdPvSY5",
  seo_yearly: "price_1SrHtSEfti9t9nN9rXMfteyT",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[add-subscription-item] Function started");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      throw new Error("Unauthorized");
    }

    const { priceKey, quantity = 1 } = await req.json();

    if (!priceKey || !MODULE_PRICE_IDS[priceKey]) {
      throw new Error("Invalid module price key");
    }

    const priceId = MODULE_PRICE_IDS[priceKey];
    const lineItemQuantity = Math.max(1, quantity);

    console.log(`[add-subscription-item] Adding ${priceKey} with quantity ${lineItemQuantity}`);

    // Find customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found. Please subscribe to a plan first.");
    }

    const customerId = customers.data[0].id;

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    const activeSubscription = subscriptions.data[0] || trialingSubscriptions.data[0];

    if (!activeSubscription) {
      throw new Error("No active subscription found. Please subscribe to a plan first.");
    }

    console.log(`[add-subscription-item] Found subscription: ${activeSubscription.id}`);

    // Check if this price is already in the subscription
    const existingItem = activeSubscription.items.data.find(
      (item: Stripe.SubscriptionItem) => item.price.id === priceId
    );

    if (existingItem) {
      // Update quantity if already exists
      console.log(`[add-subscription-item] Updating existing item quantity`);
      await stripe.subscriptionItems.update(existingItem.id, {
        quantity: existingItem.quantity + lineItemQuantity,
      });
    } else {
      // Add new item to subscription
      console.log(`[add-subscription-item] Adding new item to subscription`);
      await stripe.subscriptionItems.create({
        subscription: activeSubscription.id,
        price: priceId,
        quantity: lineItemQuantity,
      });
    }

    // Create an invoice for the prorated amount immediately
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      pending_invoice_items_behavior: "include",
    });

    // Finalize and pay the invoice
    if (invoice.id) {
      try {
        await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.pay(invoice.id);
        console.log(`[add-subscription-item] Invoice paid: ${invoice.id}`);
      } catch (invoiceError) {
        console.log(`[add-subscription-item] Invoice processing note:`, invoiceError);
        // Continue even if invoice fails - the subscription item was added
      }
    }

    // Update user's subscriptions table in Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const moduleType = priceKey.includes("aeo") ? "aeo_rank" : "seo_autopost";
    const isYearly = priceKey.includes("yearly");
    const priceMonthly = isYearly ? 39.20 : 49;

    await supabaseAdmin.from("subscriptions").upsert({
      user_id: user.id,
      module: moduleType,
      status: "active",
      price_monthly: priceMonthly * lineItemQuantity,
      current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
    }, {
      onConflict: "user_id,module",
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Module added to subscription successfully",
      subscriptionId: activeSubscription.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[add-subscription-item] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
