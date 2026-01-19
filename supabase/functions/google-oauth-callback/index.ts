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
    const { code, user_id } = await req.json();
    
    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing code or user_id" }),
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
        JSON.stringify({ error: "Server configuration error: Missing OAuth credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the redirect URI from the request origin or use a default
    const origin = req.headers.get("origin") || "https://starlinko.lovable.app";
    const redirectUri = `${origin}/dashboard`;

    console.log("Exchanging code for tokens with redirect_uri:", redirectUri);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      return new Response(
        JSON.stringify({ 
          error: "Failed to exchange code for tokens", 
          details: tokenData.error_description || tokenData.error 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    if (!refresh_token) {
      console.warn("No refresh_token received - user may need to revoke app access and reconnect");
      return new Response(
        JSON.stringify({ 
          error: "No refresh token received. Please revoke app access in Google account settings and try again.",
          hint: "Go to https://myaccount.google.com/permissions and remove Starlinko, then reconnect."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens in database
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        google_refresh_token: refresh_token,
        google_access_token: access_token,
        google_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to store tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully stored OAuth tokens for user ${user_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Google connected successfully",
        expires_at: expiresAt 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("OAuth callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
