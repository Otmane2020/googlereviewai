import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result = await getGoogleAccessToken(supabaseAdmin, user_id);

    if (result.token) {
      return new Response(
        JSON.stringify({
          success: true,
          access_token: result.token,
          // Google access tokens are valid ~1 hour
          expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("[refresh-google-token] Failed:", result.error, "reconnect:", result.requires_reconnect);

    return new Response(
      JSON.stringify({
        success: false,
        error: result.error,
        requires_reconnect: result.requires_reconnect,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[refresh-google-token] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, requires_reconnect: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
