import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefreshResult {
  success: boolean;
  access_token?: string;
  expires_at?: string;
  error?: string;
  requires_reconnect?: boolean;
}

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

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Server not configured for Google OAuth" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get current refresh token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("google_refresh_token, google_access_token, google_token_expires_at")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.google_refresh_token) {
      console.log("No refresh token stored for user", user_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No refresh token available",
          requires_reconnect: true 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if current token is still valid (with 5 min buffer)
    if (profile.google_token_expires_at) {
      const expiresAt = new Date(profile.google_token_expires_at);
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      if (expiresAt.getTime() - bufferTime > Date.now() && profile.google_access_token) {
        console.log("Token still valid, returning cached token");
        return new Response(
          JSON.stringify({ 
            success: true, 
            access_token: profile.google_access_token,
            expires_at: profile.google_token_expires_at 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Refreshing Google access token for user", user_id);

    // Refresh the access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: profile.google_refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token refresh failed:", tokenData);
      
      // Check if token was revoked
      if (tokenData.error === "invalid_grant") {
        // Clear invalid tokens
        await supabase
          .from("profiles")
          .update({
            google_refresh_token: null,
            google_access_token: null,
            google_token_expires_at: null,
          })
          .eq("id", user_id);

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Google authorization revoked",
            requires_reconnect: true 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: tokenData.error_description || "Failed to refresh token" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update tokens in database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_access_token: access_token,
        google_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("Failed to update tokens:", updateError);
    }

    console.log(`Token refreshed successfully for user ${user_id}, expires at ${expiresAt}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        access_token,
        expires_at: expiresAt 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Refresh token error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
