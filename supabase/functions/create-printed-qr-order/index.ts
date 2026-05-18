import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// QR plaque imprimée — actuellement offerte à TOUS les utilisateurs (tous plans, y compris gratuit)


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentification requise" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentification requise" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const businessId: string = body.business_id;
    const shipping = body.shipping; // {full_name, line1, line2, city, postal_code, country, phone}
    const design = body.design || "classic"; // classic | dark | minimal

    if (!businessId || !shipping?.full_name || !shipping?.line1 || !shipping?.city || !shipping?.postal_code || !shipping?.country) {
      return new Response(JSON.stringify({ error: "Adresse de livraison incomplète" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check plan
    const { data: profile } = await supabase.from("profiles").select("plan_name").eq("id", user.id).maybeSingle();
    const planName = (profile?.plan_name || "").toLowerCase();
    const isPaid = PAID_PLANS.some((p) => planName.includes(p));
    if (!isPaid) {
      return new Response(JSON.stringify({ error: "Réservé aux abonnés payants. Passez sur un plan payant pour recevoir votre QR imprimé gratuit." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check business
    const { data: business } = await supabase.from("businesses").select("id, name, google_place_id, user_id").eq("id", businessId).maybeSingle();
    if (!business || business.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Établissement introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing free redemption
    const { data: existing } = await supabase
      .from("orders").select("id").eq("user_id", user.id).eq("order_type", "printed_qr_free").maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: "Vous avez déjà commandé votre QR imprimé gratuit." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reviewUrl = business.google_place_id
      ? `https://search.google.com/local/writereview?placeid=${business.google_place_id}`
      : `https://starlinko.app/r/${business.id}`;

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_email: user.email,
      customer_name: shipping.full_name,
      amount: 0,
      currency: "eur",
      status: "paid",
      order_type: "printed_qr_free",
      business_id: businessId,
      shipping_address: shipping,
      shipping_country: shipping.country,
      shipping_cost: 0,
      qr_data: {
        url: reviewUrl,
        business_name: business.name,
        design,
      },
    }).select().single();

    if (error) {
      console.error("Order insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("order_items").insert({
      order_id: order.id,
      product_name: "QR code imprimé (adhésif prêt à coller) - GRATUIT",
      product_key: "printed_qr_free",
      price: 0,
      quantity: 1,
    });

    return new Response(JSON.stringify({ order_id: order.id, success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-printed-qr-order error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
