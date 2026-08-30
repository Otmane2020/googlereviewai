import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Shipping tiers (EUR cents). Country → tier index.
const SHIPPING_TIERS = [
  { amount: 0, label: "France — offerte (3-5j)" },
  { amount: 699, label: "Europe proche (4-7j)" },
  { amount: 999, label: "Europe étendue (5-10j)" },
  { amount: 1499, label: "Amérique du Nord (7-14j)" },
  { amount: 1999, label: "Reste du monde (10-21j)" },
];

const COUNTRY_TIER: Record<string, number> = {
  FR: 0,
  BE: 1, LU: 1, DE: 1, NL: 1,
  CH: 2, ES: 2, IT: 2, GB: 2, PT: 2, IE: 2, AT: 2, SE: 2, NO: 2, DK: 2, FI: 2, PL: 2, CZ: 2,
  US: 3, CA: 3,
};

function shippingForCountry(country: string): { amount: number; label: string } {
  const idx = COUNTRY_TIER[country?.toUpperCase()] ?? 4;
  return SHIPPING_TIERS[idx];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || "";
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" as any });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const slug = String(body.slug || "").trim();
    const quantity = Math.max(1, Math.min(20, Number(body.quantity ?? 1)));
    if (!slug) {
      return new Response(JSON.stringify({ error: "Produit invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Customer / shipping
    const shipping = (body.shipping && typeof body.shipping === "object") ? body.shipping : {};
    const email = String(body.email || shipping.email || "").trim().toLowerCase();
    const phone = String(shipping.phone || "").trim();
    const fullName = String(shipping.name || "").trim();
    const line1 = String(shipping.line1 || "").trim();
    const line2 = String(shipping.line2 || "").trim();
    const city = String(shipping.city || "").trim();
    const postal_code = String(shipping.postal_code || "").trim();
    const country = String(shipping.country || "FR").trim().toUpperCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!fullName || !phone || !line1 || !city || !postal_code || !country) {
      return new Response(JSON.stringify({ error: "Adresse de livraison incomplète" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-card config (NFC target)
    const rawConfig = (body.config && typeof body.config === "object") ? body.config : {};
    const config: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawConfig)) {
      if (typeof v === "string" && v.trim()) {
        config[String(k).slice(0, 64)] = String(v).slice(0, 500).trim();
      }
    }

    const { data: product, error: pErr } = await supabase
      .from("shop_products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
    if (pErr || !product) {
      return new Response(JSON.stringify({ error: "Produit introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional auth (guest checkout allowed)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
    }

    const unitPrice = Number(product.price_eur);
    const subtotalCents = Math.round(unitPrice * 100) * quantity;
    const ship = shippingForCountry(country);
    const shippingCents = ship.amount;
    const totalCents = subtotalCents + shippingCents;
    const amount = totalCents / 100;

    const shippingAddress = {
      name: fullName,
      phone,
      line1, line2, city, postal_code, country,
    };

    // Create order (pending)
    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      user_id: userId,
      customer_email: email,
      customer_name: fullName,
      amount,
      currency: "eur",
      status: "pending",
      order_type: "shop_product",
      shipping_address: shippingAddress,
      shipping_country: country,
      shipping_cost: shippingCents / 100,
      qr_data: { platform: product.platform, config },
      metadata: { product_slug: slug, product_id: product.id, config, phone },
    }).select().single();
    if (orderErr || !order) {
      console.error("order insert error", orderErr);
      return new Response(JSON.stringify({ error: "Création commande échouée" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("order_items").insert({
      order_id: order.id,
      product_name: product.name,
      product_key: product.slug,
      price: unitPrice,
      quantity,
      metadata: { platform: product.platform, category: product.category, config },
    });

    // Find or create Stripe customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const c = await stripe.customers.create({
        email,
        name: fullName,
        phone,
        shipping: { name: fullName, phone, address: { line1, line2, city, postal_code, country } },
      });
      customerId = c.id;
    }

    const pi = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "eur",
      customer: customerId,
      receipt_email: email,
      shipping: { name: fullName, phone, address: { line1, line2, city, postal_code, country } },
      description: `${product.name} × ${quantity}`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        user_id: userId ?? "",
        order_type: "shop_product",
        product_slug: slug,
        quantity: String(quantity),
        shipping_country: country,
      },
    });

    await supabase.from("orders").update({ stripe_session_id: pi.id }).eq("id", order.id);

    return new Response(JSON.stringify({
      clientSecret: pi.client_secret,
      publishableKey,
      amount,
      subtotal: subtotalCents / 100,
      shipping_cost: shippingCents / 100,
      shipping_label: ship.label,
      order_id: order.id,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-shop-checkout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
