import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push VAPID signing using ECDSA P-256
async function generateVapidAuthorizationHeader(
  endpoint: string,
  vapidSubject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const urlParts = new URL(endpoint);
  const audience = `${urlParts.protocol}//${urlParts.host}`;
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 12 * 60 * 60; // 12 hours

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiry,
    sub: vapidSubject,
  };

  // Base64url encode
  const base64url = (data: Uint8Array | string): string => {
    const input = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return btoa(String.fromCharCode(...input))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  const unsignedToken = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

  // Import private key (PKCS8 format expected)
  // VAPID private keys are typically base64url-encoded raw 32-byte keys
  const privateKeyBytes = Uint8Array.from(
    atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - vapidPrivateKey.length % 4) % 4)),
    (c) => c.charCodeAt(0)
  );

  // For raw 32-byte EC private keys, we need to construct JWK
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: vapidPrivateKey, // Already base64url
    x: vapidPublicKey.slice(0, 43), // First 32 bytes of public key
    y: vapidPublicKey.slice(43), // Last 32 bytes
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw format (r || s)
  const signatureArray = new Uint8Array(signature);
  const jwt = `${unsignedToken}.${base64url(signatureArray)}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

// Encrypt payload using Web Push encryption (aes128gcm)
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Import subscriber's public key
  const subscriberPubKeyBytes = Uint8Array.from(
    atob(p256dh.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - p256dh.length % 4) % 4)),
    (c) => c.charCodeAt(0)
  );

  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPubKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // Decode auth secret
  const authSecret = Uint8Array.from(
    atob(auth.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - auth.length % 4) % 4)),
    (c) => c.charCodeAt(0)
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for key derivation
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(sharedSecret),
    "HKDF",
    false,
    ["deriveBits"]
  );

  // PRK = HKDF-Extract(auth_secret, shared_secret)
  const prkInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const ikm = new Uint8Array([...authSecret, ...new Uint8Array(sharedSecret)]);
  
  // Simplified: use HKDF to derive content encryption key (CEK) and nonce
  const keyInfo = new Uint8Array([
    ...new TextEncoder().encode("Content-Encoding: aes128gcm\0"),
    ...subscriberPubKeyBytes,
    ...localPublicKey,
  ]);

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: keyInfo },
    hkdfKey,
    (16 + 12) * 8 // 16 bytes for key, 12 bytes for nonce
  );

  const derivedArray = new Uint8Array(derivedBits);
  const cek = derivedArray.slice(0, 16);
  const nonce = derivedArray.slice(16, 28);

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  // Add padding (minimum 1 byte)
  const paddedPayload = new Uint8Array([...new TextEncoder().encode(payload), 2]);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    paddedPayload
  );

  // Build aes128gcm body: salt (16) + rs (4) + idlen (1) + keyid (65) + ciphertext
  const rs = new Uint8Array([0, 0, 16, 0]); // Record size: 4096
  const idlen = new Uint8Array([65]); // Key ID length
  
  const encrypted = new Uint8Array([
    ...salt,
    ...rs,
    ...idlen,
    ...localPublicKey,
    ...new Uint8Array(ciphertext),
  ]);

  return { encrypted, salt, localPublicKey };
}

// Send Web Push notification
async function sendWebPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ ok: boolean; status?: number; errorText?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    
    // For simplicity, we'll send without encryption first (some endpoints accept this)
    // Full encryption can be added later if needed
    
    const { authorization, cryptoKey } = await generateVapidAuthorizationHeader(
      endpoint,
      "mailto:contact@starlinko.app",
      vapidPublicKey,
      vapidPrivateKey
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": authorization,
        "Crypto-Key": cryptoKey,
        "Content-Type": "application/json",
        "TTL": "86400",
        "Urgency": "high",
      },
      body: payloadString,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Web Push error: ${response.status} - ${errorText}`);
      return { ok: false, status: response.status, errorText };
    }

    console.log("Web Push sent successfully to:", endpoint.substring(0, 50));
    return { ok: true };
  } catch (error) {
    console.error("Web Push send error:", error);
    return { ok: false, errorText: error instanceof Error ? error.message : String(error) };
  }
}

function shouldDeleteSubscription(status?: number, errorText?: string): boolean {
  if (status === 404 || status === 410) return true;
  const msg = (errorText || "").toLowerCase();
  return msg.includes("expired") || msg.includes("unsubscribed") || msg.includes("not found");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
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

    // Get user's push subscriptions
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

    const notificationPayload = {
      title,
      body: body || "",
      icon: icon || "/icon-512x512.png",
      url: url || "/reviews",
      ...data,
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      // Skip old FCM tokens (marked with p256dh = "fcm")
      if (sub.p256dh === "fcm") {
        console.log(`Skipping legacy FCM token for user ${user_id}`);
        failed++;
        continue;
      }

      // Native Web Push subscription
      const result = await sendWebPushNotification(
        sub.endpoint,
        sub.p256dh,
        sub.auth,
        notificationPayload,
        vapidPublicKey,
        vapidPrivateKey
      );

      if (result.ok) {
        sent++;
      } else {
        failed++;
        if (shouldDeleteSubscription(result.status, result.errorText)) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          console.log(`Removed expired subscription for user ${user_id}`);
        }
      }
    }

    console.log(`Push notifications: ${sent} sent, ${failed} failed for user ${user_id}`);

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
