import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = "oben.rockman@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("[Receive Email Webhook] Payload:", JSON.stringify(payload, null, 2));

    // Only process email.received events
    const eventType = payload.type || "";
    if (eventType !== "email.received") {
      console.log(`[Receive Email Webhook] Ignored event type: ${eventType}`);
      return new Response(
        JSON.stringify({ success: true, ignored: true, reason: `Event type '${eventType}' not handled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = payload.data || {};
    const from = data.from || "Expéditeur inconnu";
    const subject = data.subject || "(sans objet)";
    const to = Array.isArray(data.to) ? data.to.join(", ") : (data.to || "contact@webify-app.com");
    const cc = Array.isArray(data.cc) ? data.cc.join(", ") : (data.cc || "");
    const textBody = data.text || data.html || "(aucun contenu)";
    const date = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

    // Extract sender email for reply_to
    const senderEmail = typeof from === "string" 
      ? (from.match(/<([^>]+)>/)?.[1] || (from.includes("@") ? from : undefined))
      : undefined;

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;">
      <span style="font-weight: 700; font-size: 20px; color: #ffffff;">📨 Nouvel email reçu — Webify</span>
    </div>
    
    <div style="padding: 32px 24px;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px 0;">
        Email reçu sur <strong>${to}</strong> le ${date}
      </p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; width: 100px;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">De</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #111827; font-size: 14px; font-weight: 500;">${from}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">À</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #111827; font-size: 14px;">${to}</span>
          </td>
        </tr>
        ${cc ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">CC</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #111827; font-size: 14px;">${cc}</span>
          </td>
        </tr>
        ` : ""}
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Objet</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #111827; font-size: 14px; font-weight: 600;">${subject}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; vertical-align: top;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message</span>
          </td>
          <td style="padding: 12px 0;">
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;">
              <p style="color: #111827; margin: 0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${textBody}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb; background: #f9fafb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Notification automatique — Webify Contact
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Webify Contact <contact@webify-app.com>",
        to: [NOTIFY_EMAIL],
        reply_to: senderEmail || undefined,
        subject: `[Webify] ${subject}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[Receive Email Webhook] Resend error:", errorText);
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const result = await resendResponse.json();
    console.log("[Receive Email Webhook] Notification sent:", result);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Receive Email Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
