import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  name: string;
  productKey?: string;
  price: number; // unit price in major units (USD)
  quantity: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    let userName: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .maybeSingle();
        userName = profile?.full_name ?? null;
        userEmail = userEmail || profile?.email || null;
      }
    }

    const body = await req.json();
    const items: CartItem[] = body.items ?? [];
    const email: string = body.email || userEmail || "";

    if (!items.length) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalCents = items.reduce(
      (sum, it) => sum + Math.round(it.price * 100) * it.quantity,
      0
    );

    if (totalCents < 50) {
      return new Response(JSON.stringify({ error: "Amount too small" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the order first
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_email: email,
        customer_name: userName,
        amount: totalCents / 100,
        currency: "usd",
        status: "pending",
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("Order creation failed:", orderErr);
      return new Response(JSON.stringify({ error: "Could not create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("order_items").insert(
      items.map((it) => ({
        order_id: order.id,
        product_name: it.name,
        product_key: it.productKey ?? null,
        price: it.price,
        quantity: it.quantity,
      }))
    );

    // Create the PaymentIntent
    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        user_id: userId ?? "",
      },
    });

    // Save PI id back to the order so the webhook can reconcile
    await supabase
      .from("orders")
      .update({ stripe_session_id: intent.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        clientSecret: intent.client_secret,
        publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY"),
        orderId: order.id,
        amount: totalCents / 100,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("create-payment-intent error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
