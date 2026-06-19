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
// agencyPoolCredits: total credits added to the user's agency pool (to be allocated per business)
const PLAN_CONFIG: Record<string, { credits: number; maxBusinesses: number; planName: string; agencyPoolCredits?: number; tier: number }> = {
  // ===== NEW Ranki.ai plans (June 2026) =====
  "price_1TjxSJEfti9t9nN9XgMVswCh": { credits: 50,  maxBusinesses: 1,   planName: "Starter",         tier: 1 }, // 9.99€/mo
  "price_1TjxSJEfti9t9nN91VDBOxZX": { credits: 50,  maxBusinesses: 1,   planName: "Starter Annuel",  tier: 1 }, // 95.90€/yr
  "price_1TjxSKEfti9t9nN9HAzRfqz8": { credits: 300, maxBusinesses: 3,   planName: "Pro",             tier: 3 }, // 49€/mo
  "price_1TjxSKEfti9t9nN9iv48DJvm": { credits: 300, maxBusinesses: 3,   planName: "Pro Annuel",      tier: 3 }, // 470€/yr
  "price_1TjxSLEfti9t9nN9DqcufGNo": { credits: 1000,maxBusinesses: 999, planName: "Business",        tier: 4 }, // 99€/mo
  "price_1TjxSLEfti9t9nN9GrF6F0Pw": { credits: 1000,maxBusinesses: 999, planName: "Business Annuel", tier: 4 }, // 950.40€/yr
  // ===== Legacy =====
  "price_1SrHtCEfti9t9nN9L8Fytsni": { credits: 10, maxBusinesses: 1, planName: "Starter", tier: 1 },
  "price_1SrHtDEfti9t9nN96yIPGiOo": { credits: 100, maxBusinesses: 2, planName: "Pro", tier: 3 },
  "price_1SrHtEEfti9t9nN9mq7MrV3G": { credits: 400, maxBusinesses: 999, planName: "Business", tier: 4 },
  "price_1SrHtOEfti9t9nN9fG4lSroa": { credits: 10, maxBusinesses: 1, planName: "Starter Annuel", tier: 1 },
  "price_1SrHtPEfti9t9nN9dnZ0sXpi": { credits: 100, maxBusinesses: 2, planName: "Pro Annuel", tier: 3 },
  "price_1SrHtQEfti9t9nN9GKvr4NSt": { credits: 400, maxBusinesses: 999, planName: "Business Annuel", tier: 4 },
  "price_1TSa8pEfti9t9nN9JHI4owg3": { credits: 200, maxBusinesses: 3, planName: "Quotidien", tier: 2 },
  "price_1TU9QcEfti9t9nN9MwGBzftO": { credits: 200, maxBusinesses: 3, planName: "Quotidien", tier: 2 },
  "price_1TTuIpEfti9t9nN9sy6pUNgU": { credits: 0, maxBusinesses: 999, planName: "Agence", agencyPoolCredits: 1000, tier: 5 },
  "price_1SsBcUEfti9t9nN9aqWMiw7Y": { credits: 0, maxBusinesses: 999, planName: "Agence", agencyPoolCredits: 1000, tier: 5 },
  // Legacy ranki_* (old 9.90 / 29.90 / 79.90)
  "price_1ThQt9Efti9t9nN9Wc3KFIh5": { credits: 50, maxBusinesses: 1, planName: "Starter", tier: 1 },
  "price_1ThQtAEfti9t9nN9NFe9sP82": { credits: 300, maxBusinesses: 3, planName: "Pro", tier: 3 },
  "price_1ThQtBEfti9t9nN9n7ZhXFR3": { credits: 1000, maxBusinesses: 999, planName: "Business", tier: 4 },
};

// Pick the highest-tier item from a subscription (handles multi-item subs e.g. Quotidien + Agence)
function pickBestItem(subscription: Stripe.Subscription) {
  let best: { priceId: string; config: typeof PLAN_CONFIG[string] } | null = null;
  for (const item of subscription.items.data) {
    const pid = item.price.id;
    const cfg = PLAN_CONFIG[pid];
    if (cfg && (!best || cfg.tier > best.config.tier)) best = { priceId: pid, config: cfg };
  }
  return best;
}

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


type WebhookEmailLang = "fr" | "en";

const WEBHOOK_EMAIL_TEXT = {
  fr: {
    cancelledSubject: (plan: string) => `Votre abonnement ${plan} a été annulé`,
    cancelledTitle: "Abonnement annulé",
    cancelledBody: (plan: string) => `Votre abonnement <strong>${plan}</strong> a été annulé. Vous n'avez plus accès aux fonctionnalités premium.`,
    cancelledNote: "Vos avis ne seront plus traités automatiquement. Réabonnez-vous pour reprendre le service.",
    renewedSubject: (plan: string) => `✅ Votre abonnement ${plan} a été renouvelé`,
    renewedTitle: "Abonnement renouvelé ✅",
    renewedBody: (plan: string) => `Votre abonnement <strong>${plan}</strong> a été renouvelé avec succès.`,
    creditsReloaded: "Crédits rechargés",
    cta: "Voir mon tableau de bord",
    plans: "Voir les offres",
    question: "Une question ? Répondez à cet email, nous sommes là pour vous aider.",
    hello: "Bonjour",
  },
  en: {
    cancelledSubject: (plan: string) => `Your ${plan} subscription has been cancelled`,
    cancelledTitle: "Subscription cancelled",
    cancelledBody: (plan: string) => `Your <strong>${plan}</strong> subscription has been cancelled. Premium features are no longer available.`,
    cancelledNote: "Your reviews will no longer be handled automatically. Subscribe again to resume the service.",
    renewedSubject: (plan: string) => `✅ Your ${plan} subscription has been renewed`,
    renewedTitle: "Subscription renewed ✅",
    renewedBody: (plan: string) => `Your <strong>${plan}</strong> subscription has been renewed successfully.`,
    creditsReloaded: "Credits reloaded",
    cta: "View my dashboard",
    plans: "View plans",
    question: "Questions? Reply to this email — we're here to help.",
    hello: "Hello",
  },
};

function renderWebhookSubscriptionEmail(kind: "cancelled" | "renewed", lang: WebhookEmailLang, fullName: string | null | undefined, plan: string, credits = 0) {
  const t = WEBHOOK_EMAIL_TEXT[lang];
  const firstName = fullName ? fullName.split(" ")[0] : "";
  const subject = kind === "cancelled" ? t.cancelledSubject(plan) : t.renewedSubject(plan);
  const title = kind === "cancelled" ? t.cancelledTitle : t.renewedTitle;
  const body = kind === "cancelled" ? t.cancelledBody(plan) : t.renewedBody(plan);
  const accentBox = kind === "cancelled"
    ? `<div style="background: #fef3c7; border-radius: 6px; padding: 16px; margin: 24px 0; border-left: 3px solid #f59e0b;"><p style="font-family: -apple-system, sans-serif; color: #92400e; font-size: 14px; margin: 0;">${t.cancelledNote}</p></div>`
    : `<div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;"><p style="font-family: -apple-system, sans-serif; color: #065f46; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.creditsReloaded}</p><p style="font-family: -apple-system, sans-serif; color: #111827; font-size: 36px; font-weight: 700; margin: 0;">${credits}</p></div>`;
  const ctaUrl = kind === "cancelled" ? "https://ranki.ai/select-plan" : "https://ranki.ai/dashboard";
  const ctaText = kind === "cancelled" ? t.plans : t.cta;
  const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin: 0; padding: 0; background-color: #f9fafb;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><div style="background: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="vertical-align: middle;"><img src="https://ranki.ai/favicon.png" width="32" height="32" alt="Ranki.ai" /></td><td style="vertical-align: middle; padding-left: 12px;"><span style="font-family: -apple-system, sans-serif; font-weight: 600; font-size: 18px; color: #111827;">Ranki.ai</span></td></tr></table></div><div style="padding: 40px 32px;"><h1 style="font-family: -apple-system, sans-serif; color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">${title}</h1><p style="font-family: -apple-system, sans-serif; color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${t.hello}${firstName ? ` ${firstName}` : ""},</p><p style="font-family: -apple-system, sans-serif; color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${body}</p>${accentBox}<div style="text-align: left; margin: 32px 0;"><a href="${ctaUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 500;">${ctaText}</a></div><p style="font-family: -apple-system, sans-serif; color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">${t.question}</p></div><div style="padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;"><p style="font-family: -apple-system, sans-serif; color: #9ca3af; font-size: 12px; margin: 0;">© 2025 Ranki.ai</p></div></div></body></html>`;
  return { subject, html };
}

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

        // Handle one-time NFC card orders (no subscription)
        const orderType = session.metadata?.order_type;
        const orderId = session.metadata?.order_id;
        if ((orderType === "nfc_card" || orderType === "shop_product") && orderId) {
          try {
            const ship = session.shipping_details || (session as any).customer_details;
            const shippingAddress = ship?.address ? {
              full_name: ship.name,
              line1: ship.address.line1,
              line2: ship.address.line2,
              city: ship.address.city,
              postal_code: ship.address.postal_code,
              country: ship.address.country,
              state: ship.address.state,
            } : null;
            const shippingCostCents = session.shipping_cost?.amount_total ?? 0;
            await supabaseAdmin.from("orders").update({
              status: "paid",
              shipping_address: shippingAddress,
              shipping_country: shippingAddress?.country ?? null,
              shipping_cost: shippingCostCents / 100,
              amount: (session.amount_total ?? 0) / 100,
              updated_at: new Date().toISOString(),
            }).eq("id", orderId);
            console.log(`[checkout.session.completed] ✅ NFC order ${orderId} marked paid`);
          } catch (e) {
            console.error("[checkout.session.completed] NFC order update error:", e);
          }
        }

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const best = pickBestItem(subscription);
          const priceId = best?.priceId || subscription.items.data[0]?.price.id;
          const config = best?.config;

          console.log("[checkout.session.completed] Subscription details", {
            status: subscription.status,
            priceId,
            trial_end: subscription.trial_end,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
          });

          if (config) {
            const isTrial = subscription.status === "trialing";
            
            const updateData: Record<string, unknown> = {
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

            // For Agence plan, refill the agency pool of credits
            if (config.agencyPoolCredits && config.agencyPoolCredits > 0) {
              updateData.agency_total_credits = config.agencyPoolCredits;
            }

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
                .select("email, full_name, preferred_language")
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
                      lang: (profile as any).preferred_language || "fr",
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

        const best = pickBestItem(subscription);
        const priceId = best?.priceId || subscription.items.data[0]?.price.id;
        const config = best?.config;

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
          .select("email, full_name, plan_name, preferred_language")
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
                  ...renderWebhookSubscriptionEmail(
                    "cancelled",
                    (profile as any).preferred_language === "en" ? "en" : "fr",
                    profile.full_name,
                    cancelledPlan,
                  ),
                  from_name: "Ranki.ai",
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
                .select("email, full_name, preferred_language")
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
                        ...renderWebhookSubscriptionEmail(
                          "renewed",
                          (profile as any).preferred_language === "en" ? "en" : "fr",
                          profile.full_name,
                          config.planName,
                          config.credits,
                        ),
                        from_name: "Ranki.ai",
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
