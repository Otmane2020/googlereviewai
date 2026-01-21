/**
 * Shared Google OAuth Helper
 * 
 * This module provides a centralized way to get valid Google access tokens
 * across all edge functions. It uses the refresh_token stored in the database
 * and generates a fresh access_token on demand.
 * 
 * NEVER store the access_token - always generate it fresh.
 */

export interface GoogleTokenResult {
  token: string | null;
  error: string | null;
  requires_reconnect: boolean;
}

/**
 * Get a valid Google access token for a user.
 * This function will:
 * 1. Check if the user has a refresh_token
 * 2. Use the refresh_token to get a fresh access_token
 * 3. Handle invalid_grant errors and set requires_reconnect
 * 
 * @param supabaseAdmin - Supabase client with service role key
 * @param userId - The user ID to get the token for
 * @returns GoogleTokenResult with token, error, and requires_reconnect
 */
export async function getGoogleAccessToken(
  supabaseAdmin: any,
  userId: string
): Promise<GoogleTokenResult> {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error("[GoogleAuth] Missing OAuth credentials");
    return { 
      token: null, 
      error: "Configuration error: Missing Google OAuth credentials", 
      requires_reconnect: false 
    };
  }

  // Get user profile with refresh token
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("google_refresh_token")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("[GoogleAuth] Error fetching profile:", profileError);
    return { 
      token: null, 
      error: "User profile not found", 
      requires_reconnect: false 
    };
  }

  if (!profile.google_refresh_token) {
    console.log("[GoogleAuth] No refresh token for user:", userId);
    return { 
      token: null, 
      error: "No refresh token available", 
      requires_reconnect: true 
    };
  }

  // Always refresh the token - never rely on cached access_token
  console.log("[GoogleAuth] Refreshing access token for user:", userId);

  try {
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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("[GoogleAuth] Token refresh failed:", tokenResponse.status, errorData);

      // Check if refresh token was revoked
      if (
        errorData.error === "invalid_grant" ||
        errorData.error_description?.includes("revoked") ||
        errorData.error_description?.includes("expired")
      ) {
        // Clear the invalid refresh token
        await supabaseAdmin
          .from("profiles")
          .update({
            google_refresh_token: null,
            google_access_token: null,
            google_token_expires_at: null,
          })
          .eq("id", userId);

        return { 
          token: null, 
          error: "Google authorization revoked", 
          requires_reconnect: true 
        };
      }

      return { 
        token: null, 
        error: `Token refresh failed: ${tokenResponse.status}`, 
        requires_reconnect: false 
      };
    }

    const tokenData = await tokenResponse.json();
    const newAccessToken = tokenData.access_token;

    if (!newAccessToken) {
      console.error("[GoogleAuth] No access token in response");
      return { 
        token: null, 
        error: "No access token received", 
        requires_reconnect: false 
      };
    }

    // If Google returned a new refresh token, update it
    if (tokenData.refresh_token) {
      await supabaseAdmin
        .from("profiles")
        .update({ google_refresh_token: tokenData.refresh_token })
        .eq("id", userId);
    }

    console.log("[GoogleAuth] Successfully refreshed access token for user:", userId);
    return { 
      token: newAccessToken, 
      error: null, 
      requires_reconnect: false 
    };
  } catch (error) {
    console.error("[GoogleAuth] Exception during token refresh:", error);
    return { 
      token: null, 
      error: error instanceof Error ? error.message : "Unknown error", 
      requires_reconnect: false 
    };
  }
}

/**
 * Whitelist of allowed redirect URIs for OAuth.
 * The backend determines the redirect_uri based on the request origin.
 */
export const REDIRECT_URI_MAP: Record<string, string> = {
  // Production domains
  "https://starlinko.lovable.app": "https://starlinko.lovable.app/dashboard",
  "https://www.starlinko.com": "https://www.starlinko.com/dashboard",
  "https://starlinko.com": "https://starlinko.com/dashboard",
  "https://starlinko.app": "https://starlinko.app/dashboard",
  "https://www.starlinko.app": "https://www.starlinko.app/dashboard",
  // Preview URLs for development (lovable.app and lovableproject.com)
  "https://id-preview--d71841d0-79b3-46a5-a592-aa582a40bd48.lovable.app": "https://id-preview--d71841d0-79b3-46a5-a592-aa582a40bd48.lovable.app/dashboard",
  "https://d71841d0-79b3-46a5-a592-aa582a40bd48.lovableproject.com": "https://d71841d0-79b3-46a5-a592-aa582a40bd48.lovableproject.com/dashboard",
};

/**
 * Get the redirect URI for a given origin.
 * Returns null if the origin is not whitelisted.
 */
export function getRedirectUri(origin: string): string | null {
  return REDIRECT_URI_MAP[origin] || null;
}
