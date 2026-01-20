import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Plan configurations
const PLAN_CONFIG: Record<string, { credits: number; maxBusinesses: number; planName: string }> = {
  "price_1SrHtCEfti9t9nN9L8Fytsni": { credits: 10, maxBusinesses: 1, planName: "Starter" },
  "price_1SrHtDEfti9t9nN96yIPGiOo": { credits: 100, maxBusinesses: 2, planName: "Pro" },
  "price_1SrHtEEfti9t9nN9mq7MrV3G": { credits: 400, maxBusinesses: 999, planName: "Business" },
  "price_1SrHtOEfti9t9nN9fG4lSroa": { credits: 10, maxBusinesses: 1, planName: "Starter Annuel" },
  "price_1SrHtPEfti9t9nN9dnZ0sXpi": { credits: 100, maxBusinesses: 2, planName: "Pro Annuel" },
  "price_1SrHtQEfti9t9nN9GKvr4NSt": { credits: 400, maxBusinesses: 999, planName: "Business Annuel" },
};

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  console.log("Received event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const config = PLAN_CONFIG[priceId];

          if (config) {
            const isTrial = subscription.status === "trialing";
            const trialEnd = subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : null;

            // Update user profile
            await supabaseAdmin.from("profiles").update({
              plan_name: config.planName,
              plan_id: priceId,
              credits: config.credits, // Give credits even during trial
              max_businesses: config.maxBusinesses,
              subscription_status: isTrial ? "trial" : "active",
              trial_end: trialEnd,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              billing_cycle: subscription.items.data[0]?.price.recurring?.interval || "month",
            }).eq("id", userId);

            console.log(`Updated profile for user ${userId} with plan ${config.planName}${isTrial ? " (trial)" : ""}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get customer to find user
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const userId = customer.metadata?.supabase_user_id;
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id;
        const config = PLAN_CONFIG[priceId];

        if (config) {
          const isTrial = subscription.status === "trialing";
          const trialEnd = subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null;

          await supabaseAdmin.from("profiles").update({
            plan_name: config.planName,
            plan_id: priceId,
            subscription_status: isTrial ? "trial" : subscription.status,
            trial_end: trialEnd,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const userId = customer.metadata?.supabase_user_id;
        if (!userId) break;

        // Reset to free plan
        await supabaseAdmin.from("profiles").update({
          plan_name: null,
          plan_id: null,
          subscription_status: "canceled",
          credits: 0,
          max_businesses: 1,
        }).eq("id", userId);

        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId && invoice.billing_reason === "subscription_cycle") {
          // Renew credits on successful payment
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          
          if (!customer.deleted) {
            const userId = customer.metadata?.supabase_user_id;
            const priceId = subscription.items.data[0]?.price.id;
            const config = PLAN_CONFIG[priceId];

            if (userId && config) {
              await supabaseAdmin.from("profiles").update({
                credits: config.credits,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              }).eq("id", userId);

              console.log(`Renewed credits for user ${userId}`);
            }
          }
        }
        break;
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing webhook:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
