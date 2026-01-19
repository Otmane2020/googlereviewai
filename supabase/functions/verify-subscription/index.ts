import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ valid: false, reason: "unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Find customer in Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      // No Stripe customer = no valid subscription
      await supabaseAdmin
        .from("profiles")
        .update({
          plan_name: null,
          plan_id: null,
          subscription_status: null,
          trial_end: null,
          current_period_start: null,
          current_period_end: null,
        })
        .eq("id", user.id);

      return new Response(JSON.stringify({ 
        valid: false, 
        reason: "no_customer",
        message: "Aucun abonnement trouvé"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "all",
      limit: 10,
    });

    // Find active or trialing subscription
    const activeSubscription = subscriptions.data.find(
      (sub: Stripe.Subscription) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      // No active subscription - reset profile
      await supabaseAdmin
        .from("profiles")
        .update({
          plan_name: null,
          plan_id: null,
          subscription_status: "cancelled",
          trial_end: null,
          current_period_start: null,
          current_period_end: null,
        })
        .eq("id", user.id);

      return new Response(JSON.stringify({ 
        valid: false, 
        reason: "no_active_subscription",
        message: "Aucun abonnement actif"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if trial has expired
    if (activeSubscription.status === "trialing" && activeSubscription.trial_end) {
      const trialEndDate = new Date(activeSubscription.trial_end * 1000);
      if (trialEndDate < new Date()) {
        // Trial expired
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "trial_expired",
          })
          .eq("id", user.id);

        return new Response(JSON.stringify({ 
          valid: false, 
          reason: "trial_expired",
          message: "Votre essai gratuit a expiré"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Subscription is valid - update profile with correct info
    const priceId = activeSubscription.items.data[0]?.price.id;
    
    // Map price IDs to plan names
    const planMapping: Record<string, { name: string; credits: number; maxBusinesses: number }> = {
      "price_1RVn5sP3jJGT2fKYKSZrqazB": { name: "starter", credits: 50, maxBusinesses: 1 },
      "price_1RVnBEP3jJGT2fKYZt2eOI2Q": { name: "starter", credits: 50, maxBusinesses: 1 },
      "price_1RVnCfP3jJGT2fKY26hl5EsV": { name: "pro", credits: 200, maxBusinesses: 5 },
      "price_1RVnE3P3jJGT2fKYLdwpnO0l": { name: "pro", credits: 200, maxBusinesses: 5 },
      "price_1RVnElP3jJGT2fKYKZnkClwH": { name: "business", credits: 500, maxBusinesses: 20 },
      "price_1RVnFRP3jJGT2fKYYP0I6Kbz": { name: "business", credits: 500, maxBusinesses: 20 },
    };

    const planInfo = planMapping[priceId] || { name: "starter", credits: 50, maxBusinesses: 1 };

    await supabaseAdmin
      .from("profiles")
      .update({
        plan_name: planInfo.name,
        plan_id: priceId,
        subscription_status: activeSubscription.status === "trialing" ? "trial" : "active",
        trial_end: activeSubscription.trial_end 
          ? new Date(activeSubscription.trial_end * 1000).toISOString() 
          : null,
        current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
        max_businesses: planInfo.maxBusinesses,
      })
      .eq("id", user.id);

    return new Response(JSON.stringify({ 
      valid: true, 
      status: activeSubscription.status,
      plan: planInfo.name,
      trialEnd: activeSubscription.trial_end 
        ? new Date(activeSubscription.trial_end * 1000).toISOString() 
        : null,
      periodEnd: new Date(activeSubscription.current_period_end * 1000).toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying subscription:", message);
    return new Response(JSON.stringify({ valid: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
