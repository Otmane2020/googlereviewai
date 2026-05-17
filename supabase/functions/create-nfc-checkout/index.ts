import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Shipping prices per country (EUR)
const SHIPPING_RATES: Record<string, { amount: number; label: string }> = {
  FR: { amount: 399, label: "Livraison France (3-5 jours)" },
  BE: { amount: 699, label: "Livraison Belgique" },
  LU: { amount: 699, label: "Livraison Luxembourg" },
  CH: { amount: 999, label: "Livraison Suisse" },
  DE: { amount: 799, label: "Livraison Allemagne" },
  ES: { amount: 799, label: "Livraison Espagne" },
  IT: { amount: 799, label: "Livraison Italie" },
  GB: { amount: 999, label: "Livraison Royaume-Uni" },
  US: { amount: 1499, label: "Livraison USA" },
  CA: { amount: 1499, label: "Livraison Canada" },
  INTL: { amount: 1999, label: "Livraison Internationale" },
};

const ALLOWED_COUNTRIES = [
  "FR","BE","LU","CH","DE","ES","IT","GB","US","CA","NL","PT","IE","AT","SE","NO","DK","FI","PL","CZ","AU","NZ","JP","SG","AE","MA","TN","DZ","SN","CI"
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil" as any,
    });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;
    if (authHeader) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
      userEmail = data?.user?.email ?? null;
    }
    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ error: "Authentification requise" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const quantity = Math.max(1, Math.min(50, Number(body.quantity ?? 1)));
    const businessId: string | null = body.business_id ?? null;

    // Build shipping options - all allowed countries with their flat rate
    const shippingOptions = ALLOWED_COUNTRIES.map((code) => {
      const rate = SHIPPING_RATES[code] ?? SHIPPING_RATES.INTL;
      return {
        shipping_rate_data: {
          type: "fixed_amount" as const,
          fixed_amount: { amount: rate.amount, currency: "eur" },
          display_name: `${code} - ${rate.label}`,
          delivery_estimate: {
            minimum: { unit: "business_day" as const, value: 3 },
            maximum: { unit: "business_day" as const, value: 14 },
          },
        },
      };
    });

    // Pre-create order
    const unitPrice = 19.99;
    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      user_id: userId,
      customer_email: userEmail,
      amount: unitPrice * quantity,
      currency: "eur",
      status: "pending",
      order_type: "nfc_card",
      business_id: businessId,
    }).select().single();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Création commande échouée" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await supabase.from("order_items").insert({
      order_id: order.id,
      product_name: "Carte NFC Starlinko (avis Google)",
      product_key: "nfc_card",
      price: unitPrice,
      quantity,
    });

    const origin = req.headers.get("origin") || "https://starlinko.app";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: Math.round(unitPrice * 100),
          product_data: {
            name: "Carte NFC Starlinko",
            description: "Carte NFC personnalisée pour collecter des avis Google en 1 tap.",
          },
        },
        quantity,
      }],
      shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES as any },
      shipping_options: shippingOptions as any,
      billing_address_collection: "required",
      success_url: `${origin}/commandes?success=1&order_id=${order.id}`,
      cancel_url: `${origin}/boutique?canceled=1`,
      metadata: {
        order_id: order.id,
        user_id: userId,
        order_type: "nfc_card",
      },
    });

    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url, order_id: order.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-nfc-checkout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
