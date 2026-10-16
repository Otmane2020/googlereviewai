import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
    if (!stripeKey || !/^(sk|rk)_(test|live)_/.test(stripeKey)) {
      return new Response(JSON.stringify({
        error: "STRIPE_SECRET_KEY is missing or invalid in the Edge Function secrets.",
        code: "STRIPE_NOT_CONFIGURED",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 });
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+/i.test(authHeader)) {
      return new Response(JSON.stringify({ error: "Sign in to manage billing", code: "AUTH_REQUIRED" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
      });
    }
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      throw new Error("Unauthorized");
    }

    const { returnUrl } = await req.json();
    const origin = req.headers.get("origin") || "https://reviewsai.store";
    const fallback = "https://reviewsai.store/settings";
    let safeReturnUrl = fallback;
    try {
      const parsed = new URL(returnUrl || origin + "/settings");
      const originUrl = new URL(origin);
      if (parsed.protocol === "https:" && parsed.origin === originUrl.origin && (
        parsed.hostname === "reviewsai.store" || parsed.hostname === "www.reviewsai.store" ||
        parsed.hostname === "starlinko.lovable.app" || parsed.hostname.endsWith(".lovable.app")
      )) safeReturnUrl = parsed.toString();
    } catch { /* use trusted production URL */ }

    // Find customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ error: "No Stripe billing customer for this email yet.", code: "STRIPE_CUSTOMER_NOT_FOUND" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: safeReturnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[create-portal-session] Error:", message);
    const err = error as { type?: string; code?: string; requestId?: string; statusCode?: number };
    const code = err?.type === "StripeAuthenticationError" ? "STRIPE_AUTH_FAILED"
      : /portal.*config|no configuration/i.test(message) ? "STRIPE_PORTAL_NOT_CONFIGURED"
      : "STRIPE_PORTAL_FAILED";
    return new Response(JSON.stringify({
      error: code === "STRIPE_AUTH_FAILED" ? "Stripe API key is invalid for this billing account."
        : code === "STRIPE_PORTAL_NOT_CONFIGURED" ? "Configure the Stripe Customer Portal before managing subscriptions."
        : "Unable to open Stripe Billing Portal.",
      code, request_id: err?.requestId || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: code === "STRIPE_PORTAL_NOT_CONFIGURED" ? 503 : 502,
    });
  }
});
