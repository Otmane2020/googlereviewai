import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { REDIRECT_URI_MAP } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine redirect_uri from origin (whitelist-based)
    const origin = req.headers.get("origin") || "";
    const redirectUri = REDIRECT_URI_MAP[origin];

    if (!redirectUri) {
      console.error("Unauthorized origin:", origin);
      console.log("Available origins:", Object.keys(REDIRECT_URI_MAP));
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized origin",
          hint: `Origin '${origin}' is not in the whitelist. Contact support.`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[OAuth URL] Origin: ${origin}, Redirect URI: ${redirectUri}`);

    // Build OAuth URL with required parameters
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_OAUTH_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent", // Always force consent to get refresh_token
      state: user_id, // Pass user_id in state for security
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return new Response(
      JSON.stringify({ auth_url: authUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating OAuth URL:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
