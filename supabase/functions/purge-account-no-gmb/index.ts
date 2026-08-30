import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    // Safety: only purge accounts with no business listing at all
    const { count } = await admin
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ purged: false, reason: "user_has_businesses" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Safety: never purge an account that already paid
    const { count: subCount } = await admin
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("subscribed", true);

    if ((subCount ?? 0) > 0) {
      return new Response(
        JSON.stringify({ purged: false, reason: "active_subscription" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Best-effort cleanup of app rows, then remove the auth user entirely
    for (const table of ["ai_settings", "subscribers", "profiles"]) {
      const col = table === "profiles" ? "id" : "user_id";
      const { error } = await admin.from(table).delete().eq(col, user.id);
      if (error) console.warn(`[purge-account-no-gmb] ${table}:`, error.message);
    }

    const { error: delError } = await admin.auth.admin.deleteUser(user.id);
    if (delError) throw delError;

    console.log("[purge-account-no-gmb] purged user", user.id);
    return new Response(JSON.stringify({ purged: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[purge-account-no-gmb]", e);
    return new Response(JSON.stringify({ purged: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
