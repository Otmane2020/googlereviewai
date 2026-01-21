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

// Helper function to safely convert Unix timestamp to ISO string
const safeTimestampToISO = (timestamp: number | null | undefined): string | null => {
  if (timestamp === null || timestamp === undefined || isNaN(timestamp)) {
    console.log("[Webhook] Invalid timestamp:", timestamp);
    return null;
  }
  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      console.log("[Webhook] Invalid date from timestamp:", timestamp);
      return null;
    }
    return date.toISOString();
  } catch (e) {
    console.log("[Webhook] Error converting timestamp:", e);
    return null;
  }
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

        console.log("[checkout.session.completed] Processing", { userId, subscriptionId });

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const config = PLAN_CONFIG[priceId];

          console.log("[checkout.session.completed] Subscription details", {
            status: subscription.status,
            priceId,
            trial_end: subscription.trial_end,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
          });

          if (config) {
            const isTrial = subscription.status === "trialing";
            
            const updateData = {
              plan_name: config.planName,
              plan_id: priceId,
              credits: config.credits,
              max_businesses: config.maxBusinesses,
              subscription_status: isTrial ? "trial" : "active",
              trial_end: safeTimestampToISO(subscription.trial_end),
              current_period_start: safeTimestampToISO(subscription.current_period_start),
              current_period_end: safeTimestampToISO(subscription.current_period_end),
              billing_cycle: subscription.items.data[0]?.price.recurring?.interval || "month",
            };

            console.log("[checkout.session.completed] Updating profile with:", updateData);

            const { error } = await supabaseAdmin.from("profiles").update(updateData).eq("id", userId);

            if (error) {
              console.error("[checkout.session.completed] Database error:", error);
              throw error;
            }

            console.log(`[checkout.session.completed] ✅ Updated profile for user ${userId} with plan ${config.planName}${isTrial ? " (trial)" : ""}`);

            // Send welcome/subscription confirmation email
            try {
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("email, full_name")
                .eq("id", userId)
                .single();

              if (profile?.email) {
                console.log("[checkout.session.completed] Sending welcome email to:", profile.email);
                
                const emailResponse = await fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                    },
                    body: JSON.stringify({
                      email: profile.email,
                      name: profile.full_name,
                    }),
                  }
                );

                if (emailResponse.ok) {
                  console.log("[checkout.session.completed] ✅ Welcome email sent successfully");
                } else {
                  const emailError = await emailResponse.text();
                  console.error("[checkout.session.completed] Email error:", emailError);
                }
              }
            } catch (emailErr) {
              console.error("[checkout.session.completed] Error sending welcome email:", emailErr);
              // Don't throw - email failure shouldn't break the subscription flow
            }
          } else {
            console.warn("[checkout.session.completed] No config found for priceId:", priceId);
          }
        } else {
          console.warn("[checkout.session.completed] Missing userId or subscriptionId", { userId, subscriptionId });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("[customer.subscription.updated] Processing", { customerId });

        // Get customer to find user
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const userId = customer.metadata?.supabase_user_id;
        if (!userId) {
          console.log("[customer.subscription.updated] No userId in customer metadata");
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const config = PLAN_CONFIG[priceId];

        if (config) {
          const isTrial = subscription.status === "trialing";

          const updateData = {
            plan_name: config.planName,
            plan_id: priceId,
            subscription_status: isTrial ? "trial" : subscription.status,
            trial_end: safeTimestampToISO(subscription.trial_end),
            current_period_start: safeTimestampToISO(subscription.current_period_start),
            current_period_end: safeTimestampToISO(subscription.current_period_end),
          };

          console.log("[customer.subscription.updated] Updating profile with:", updateData);

          await supabaseAdmin.from("profiles").update(updateData).eq("id", userId);
          
          console.log(`[customer.subscription.updated] ✅ Updated for user ${userId}`);
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

        console.log(`[customer.subscription.deleted] ✅ Subscription canceled for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        console.log("[invoice.payment_succeeded] Processing", { 
          subscriptionId, 
          billing_reason: invoice.billing_reason 
        });
        
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
              const updateData = {
                credits: config.credits,
                current_period_start: safeTimestampToISO(subscription.current_period_start),
                current_period_end: safeTimestampToISO(subscription.current_period_end),
              };

              await supabaseAdmin.from("profiles").update(updateData).eq("id", userId);

              console.log(`[invoice.payment_succeeded] ✅ Renewed credits for user ${userId}`);
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
