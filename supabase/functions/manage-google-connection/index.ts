import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { managedLocationLimit } from "../_shared/plan-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ success: false, error: "Authentication required" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const client = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json({ success: false, error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceRoleKey);
    const { action } = await req.json();
    if (action !== "status" && action !== "disconnect") {
      return json({ success: false, error: "Invalid action" }, 400);
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("google_refresh_token, max_businesses, plan_name, subscription_status, current_period_end, trial_end")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || !profile) return json({ success: false, error: "Profile unavailable" }, 500);

    if (action === "status") {
      const { data: activeBusinesses, error: businessError } = await admin
        .from("businesses")
        .select("google_place_id")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (businessError) return json({ success: false, error: "Businesses unavailable" }, 500);

      return json({
        success: true,
        connected: Boolean(profile.google_refresh_token),
        active_count: activeBusinesses?.length || 0,
        active_google_place_ids: (activeBusinesses || []).map((b) => b.google_place_id).filter(Boolean),
        max_businesses: managedLocationLimit(profile),
      });
    }

    // Disconnect only the authenticated user's Google authorization.
    // Preserve all existing businesses, review history and plan settings.
    const previousRefreshToken = profile.google_refresh_token;
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        google_refresh_token: null,
        google_access_token: null,
        google_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateError) return json({ success: false, error: "Unable to disconnect Google" }, 500);

    // Best-effort Google token revocation. Local disconnection always succeeds
    // even when Google is temporarily unavailable.
    if (previousRefreshToken) {
      try {
        const revokeResponse = await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: previousRefreshToken }),
          signal: AbortSignal.timeout(5000),
        });
        if (!revokeResponse.ok) console.warn("[Google disconnect] Remote revocation status", revokeResponse.status);
      } catch (e) {
        console.warn("[Google disconnect] Remote revocation unavailable", e);
      }
    }
    return json({ success: true, connected: false });
  } catch (e) {
    console.error("[manage-google-connection]", e);
    return json({ success: false, error: "Connection operation failed" }, 500);
  }
});
