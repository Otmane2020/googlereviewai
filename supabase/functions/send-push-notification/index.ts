import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Send notification via Firebase Cloud Messaging
async function sendFCMNotification(
  fcmToken: string,
  title: string,
  body: string,
  icon: string,
  url: string,
  data: Record<string, string>,
  accessToken: string
): Promise<boolean> {
  try {
    const projectId = "starlinkoapp";
    
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        webpush: {
          notification: {
            icon,
            badge: "/icon-192x192.svg",
            click_action: url,
          },
          fcm_options: {
            link: url,
          },
        },
        data: {
          ...data,
          url,
        },
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FCM error: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log("FCM message sent:", result.name);
    return true;
  } catch (error) {
    console.error("FCM send error:", error);
    return false;
  }
}

// Get OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Base64url encode
  const base64url = (obj: unknown): string => {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  const unsignedToken = `${base64url(header)}.${base64url(payload)}`;

  // Import private key and sign
  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${signatureBase64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Support two ways to configure Firebase:
    // 1. FIREBASE_SERVICE_ACCOUNT as full JSON
    // 2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY as separate secrets
    let serviceAccount: { client_email: string; private_key: string; project_id?: string };
    
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
    const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");
    
    if (clientEmail && privateKey) {
      // Use separate secrets (preferred - avoids JSON parsing issues)
      console.log("Using separate Firebase secrets");
      console.log("Client email:", clientEmail);
      console.log("Private key length:", privateKey.length);
      console.log("Private key starts with:", privateKey.substring(0, 50));
      console.log("Private key ends with:", privateKey.substring(privateKey.length - 50));
      
      // Properly handle the private key - it should have literal \n characters
      let processedKey = privateKey;
      if (privateKey.includes('\\n')) {
        processedKey = privateKey.replace(/\\n/g, '\n');
      }
      
      serviceAccount = {
        client_email: clientEmail,
        private_key: processedKey,
        project_id: "starlinkoapp",
      };
    } else if (serviceAccountJson) {
      // Try to parse full JSON
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        console.log("Service account parsed successfully, project:", serviceAccount.project_id);
      } catch (parseError) {
        console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON - Parse error:", parseError);
        console.error("JSON length:", serviceAccountJson.length);
        return new Response(
          JSON.stringify({ error: "Invalid Firebase service account configuration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.error("Firebase not configured - need either FIREBASE_SERVICE_ACCOUNT or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY");
      return new Response(
        JSON.stringify({ error: "Firebase service account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, icon, url, data } = await req.json();

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or title" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's push subscriptions (FCM tokens)
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions for user ${user_id}`);
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token for FCM API
    let accessToken: string;
    try {
      accessToken = await getAccessToken(serviceAccount);
    } catch (error) {
      console.error("Failed to get FCM access token:", error);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Firebase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationIcon = icon || "/icon-512x512.png";
    const notificationUrl = url || "/reviews";
    const notificationData = data || {};

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      // Check if this is an FCM token (marked with p256dh = "fcm")
      if (sub.p256dh === "fcm") {
        const fcmToken = sub.endpoint;
        
        const success = await sendFCMNotification(
          fcmToken,
          title,
          body || "",
          notificationIcon,
          notificationUrl,
          notificationData,
          accessToken
        );

        if (success) {
          sent++;
        } else {
          failed++;
          // Remove invalid token
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`Removed invalid FCM token for user ${user_id}`);
        }
      } else {
        // Legacy Web Push subscription - skip or try to handle
        console.log(`Skipping legacy Web Push subscription for user ${user_id}`);
        failed++;
      }
    }

    console.log(`Push notifications sent: ${sent} success, ${failed} failed for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
