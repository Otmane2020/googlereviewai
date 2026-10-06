import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ ok: false, status: "DOWN", latencyMs: Date.now() - startedAt }),
        { status: 503, headers },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Use a real database request so monitors fail if Lovable Cloud/Supabase is unavailable.
    const { error } = await supabase
      .from("visitor_analytics")
      .select("*", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      console.error("health-cloud database check failed:", error);
      return new Response(
        JSON.stringify({ ok: false, status: "DOWN", latencyMs: Date.now() - startedAt }),
        { status: 503, headers },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, status: "OK", latencyMs: Date.now() - startedAt }),
      { status: 200, headers },
    );
  } catch (error) {
    console.error("health-cloud unexpected error:", error);
    return new Response(
      JSON.stringify({ ok: false, status: "DOWN", latencyMs: Date.now() - startedAt }),
      { status: 503, headers },
    );
  }
});
