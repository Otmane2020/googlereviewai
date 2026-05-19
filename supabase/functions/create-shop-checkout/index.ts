import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe max 5 shipping rates per session — we group destinations into 5 tiers
const SHIPPING_TIERS = [
  { amount: 0,    label: "France — livraison offerte (3-5 jours)", min: 3, max: 5 },
  { amount: 699,  label: "Europe — Belgique, Luxembourg, Allemagne (4-7 jours)", min: 4, max: 7 },
  { amount: 999,  label: "Europe étendue — Suisse, Espagne, Italie, UK (5-10 jours)", min: 5, max: 10 },
  { amount: 1499, label: "Amérique du Nord — USA, Canada (7-14 jours)", min: 7, max: 14 },
  { amount: 1999, label: "Reste du monde (10-21 jours)", min: 10, max: 21 },
];

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

    const body = await req.json();
    const slug = String(body.slug || "").trim();
    const quantity = Math.max(1, Math.min(20, Number(body.quantity ?? 1)));
    if (!slug) {
      return new Response(JSON.stringify({ error: "Produit invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: product, error: pErr } = await supabase
      .from("shop_products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
    if (pErr || !product) {
      return new Response(JSON.stringify({ error: "Produit introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional auth (allow guest checkout)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = String(body.email || "").trim() || null;
    if (authHeader) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
      if (!userEmail) userEmail = data?.user?.email ?? null;
    }

    const unitPrice = Number(product.price_eur);
    const amount = unitPrice * quantity;

    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      user_id: userId,
      customer_email: userEmail || "guest@ranki.ai",
      amount,
      currency: "eur",
      status: "pending",
      order_type: "shop_product",
      metadata: { product_slug: slug, product_id: product.id },
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
      metadata: { platform: product.platform, category: product.category },
    });

    const shippingOptions = SHIPPING_TIERS.map((tier) => ({
      shipping_rate_data: {
        type: "fixed_amount" as const,
        fixed_amount: { amount: tier.amount, currency: "eur" },
        display_name: tier.label,
        delivery_estimate: {
          minimum: { unit: "business_day" as const, value: tier.min },
          maximum: { unit: "business_day" as const, value: tier.max },
        },
      },
    }));

    const origin = req.headers.get("origin") || "https://ranki.ai";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail || undefined,
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: Math.round(unitPrice * 100),
          product_data: {
            name: product.name,
            description: product.description?.slice(0, 250) || undefined,
          },
        },
        quantity,
      }],
      shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES as any },
      shipping_options: shippingOptions as any,
      billing_address_collection: "required",
      success_url: `${origin}/commandes?success=1&order_id=${order.id}`,
      cancel_url: `${origin}/shop/${slug}?canceled=1`,
      metadata: {
        order_id: order.id,
        user_id: userId ?? "",
        order_type: "shop_product",
        product_slug: slug,
      },
    });

    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url, order_id: order.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-shop-checkout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
