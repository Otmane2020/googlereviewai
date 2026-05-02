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

        // Mark any abandoned carts as converted
        if (userId) {
          try {
            const { data: convertedCarts } = await supabaseAdmin
              .from("abandoned_carts")
              .update({ converted: true, converted_at: new Date().toISOString() })
              .eq("user_id", userId)
              .eq("converted", false)
              .select("id");
            
            if (convertedCarts && convertedCarts.length > 0) {
              console.log(`[checkout.session.completed] ✅ Marked ${convertedCarts.length} abandoned cart(s) as converted`);
            }
          } catch (cartErr) {
            console.error("[checkout.session.completed] Error marking abandoned carts:", cartErr);
          }
        }

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

            // Send subscription confirmation email with plan details
            try {
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("email, full_name")
                .eq("id", userId)
                .single();

              if (profile?.email) {
                console.log("[checkout.session.completed] Sending subscription email to:", profile.email);
                
                const emailResponse = await fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-subscription-email`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                    },
                    body: JSON.stringify({
                      email: profile.email,
                      name: profile.full_name,
                      plan_name: config.planName,
                      credits: config.credits,
                      max_businesses: config.maxBusinesses,
                      billing_cycle: subscription.items.data[0]?.price.recurring?.interval || "month",
                      is_trial: isTrial,
                      trial_days: 3,
                    }),
                  }
                );

                if (emailResponse.ok) {
                  console.log("[checkout.session.completed] ✅ Subscription email sent successfully");
                } else {
                  const emailError = await emailResponse.text();
                  console.error("[checkout.session.completed] Email error:", emailError);
                }
              }
            } catch (emailErr) {
              console.error("[checkout.session.completed] Error sending subscription email:", emailErr);
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

        // Get user email for cancellation notification
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name, plan_name")
          .eq("id", userId)
          .single();

        const cancelledPlan = profile?.plan_name || "votre abonnement";

        // Reset to free plan
        await supabaseAdmin.from("profiles").update({
          plan_name: null,
          plan_id: null,
          subscription_status: "canceled",
          credits: 0,
          max_businesses: 1,
        }).eq("id", userId);

        console.log(`[customer.subscription.deleted] ✅ Subscription canceled for user ${userId}`);

        // Send cancellation email
        if (profile?.email) {
          try {
            await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-notification`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                },
                body: JSON.stringify({
                  to: profile.email,
                  subject: `Votre abonnement ${cancelledPlan} a été annulé`,
                  html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;"><img src="https://starlinko.app/favicon.png" width="32" height="32" alt="Starlinko" /></td>
          <td style="vertical-align: middle; padding-left: 12px;"><span style="font-family: -apple-system, sans-serif; font-weight: 600; font-size: 18px; color: #111827;">Starlinko</span></td>
        </tr>
      </table>
    </div>
    <div style="padding: 40px 32px;">
      <h1 style="font-family: -apple-system, sans-serif; color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Abonnement annulé
      </h1>
      <p style="font-family: -apple-system, sans-serif; color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour${profile.full_name ? ` ${profile.full_name.split(" ")[0]}` : ""},
      </p>
      <p style="font-family: -apple-system, sans-serif; color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Votre abonnement <strong>${cancelledPlan}</strong> a été annulé. Vous n'avez plus accès aux fonctionnalités premium.
      </p>
      <div style="background: #fef3c7; border-radius: 6px; padding: 16px; margin: 24px 0; border-left: 3px solid #f59e0b;">
        <p style="font-family: -apple-system, sans-serif; color: #92400e; font-size: 14px; margin: 0;">
          Vos avis ne seront plus traités automatiquement. Réabonnez-vous pour reprendre le service.
        </p>
      </div>
      <div style="text-align: left; margin: 32px 0;">
        <a href="https://starlinko.app/select-plan" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 500;">
          Voir les offres
        </a>
      </div>
      <p style="font-family: -apple-system, sans-serif; color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
        Une question ? Répondez à cet email, nous sommes là pour vous aider.
      </p>
    </div>
    <div style="padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-family: -apple-system, sans-serif; color: #9ca3af; font-size: 12px; margin: 0;">© 2025 Starlinko</p>
    </div>
  </div>
</body>
</html>
                  `,
                  from_name: "Starlinko",
                }),
              }
            );
            console.log("[customer.subscription.deleted] Cancellation email sent");
          } catch (emailErr) {
            console.error("[customer.subscription.deleted] Email error:", emailErr);
          }
        }
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

              // Send renewal confirmation email
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("email, full_name")
                .eq("id", userId)
                .single();

              if (profile?.email) {
                try {
                  await fetch(
                    `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-notification`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                      },
                      body: JSON.stringify({
                        to: profile.email,
                        subject: `✅ Votre abonnement ${config.planName} a été renouvelé`,
                        html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;"><img src="https://starlinko.app/favicon.png" width="32" height="32" alt="Starlinko" /></td>
          <td style="vertical-align: middle; padding-left: 12px;"><span style="font-family: -apple-system, sans-serif; font-weight: 600; font-size: 18px; color: #111827;">Starlinko</span></td>
        </tr>
      </table>
    </div>
    <div style="padding: 40px 32px;">
      <h1 style="font-family: -apple-system, sans-serif; color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Abonnement renouvelé ✅
      </h1>
      <p style="font-family: -apple-system, sans-serif; color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour${profile.full_name ? ` ${profile.full_name.split(" ")[0]}` : ""},
      </p>
      <p style="font-family: -apple-system, sans-serif; color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Votre abonnement <strong>${config.planName}</strong> a été renouvelé avec succès.
      </p>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-family: -apple-system, sans-serif; color: #065f46; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Crédits rechargés
        </p>
        <p style="font-family: -apple-system, sans-serif; color: #111827; font-size: 36px; font-weight: 700; margin: 0;">
          ${config.credits}
        </p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://starlinko.app/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 500;">
          Voir mon tableau de bord
        </a>
      </div>
    </div>
    <div style="padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-family: -apple-system, sans-serif; color: #9ca3af; font-size: 12px; margin: 0;">© 2025 Starlinko</p>
    </div>
  </div>
</body>
</html>
                        `,
                        from_name: "Starlinko",
                      }),
                    }
                  );
                  console.log("[invoice.payment_succeeded] Renewal email sent");
                } catch (emailErr) {
                  console.error("[invoice.payment_succeeded] Email error:", emailErr);
                }
              }
            }
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("[payment_intent.succeeded] Processing", pi.id);

        const { data: order, error: orderErr } = await supabaseAdmin
          .from("orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("stripe_session_id", pi.id)
          .select()
          .maybeSingle();

        if (orderErr) {
          console.error("[payment_intent.succeeded] DB error:", orderErr);
        } else if (!order) {
          console.warn("[payment_intent.succeeded] No matching order for PI:", pi.id);
        } else {
          console.log(`[payment_intent.succeeded] ✅ Order ${order.id} marked as paid`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("[payment_intent.payment_failed]", pi.id);
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("stripe_session_id", pi.id);
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
