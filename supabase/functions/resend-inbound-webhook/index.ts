import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = "oben.rockman@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("[Inbound Webhook] Received payload:", JSON.stringify(payload, null, 2));

    // CRITICAL: Only process email.received events to avoid loops
    const eventType = payload.type || "";
    if (eventType !== "email.received") {
      console.log(`[Inbound Webhook] Ignored event type: ${eventType}`);
      return new Response(
        JSON.stringify({ success: true, ignored: true, reason: `Event type '${eventType}' not handled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract data from the nested structure
    const data = payload.data || {};
    const from = data.from || payload.from || "Expéditeur inconnu";
    const subject = data.subject || payload.subject || "(sans objet)";
    const textBody = data.text || data.html || payload.text || payload.html || "(aucun contenu)";
    const to = Array.isArray(data.to) ? data.to.join(", ") : (data.to || payload.to || "support@ranki.ai");

    // Extract sender email for reply_to
    const senderEmail = typeof from === "string" 
      ? (from.match(/<([^>]+)>/)?.[1] || (from.includes("@") ? from : undefined))
      : undefined;
    const date = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

    // Send notification to oben.rockman@gmail.com
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;">
            <span style="font-weight: 600; font-size: 18px; color: #111827;">📧 Nouvel email reçu</span>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="padding: 32px 24px;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px 0;">
        Un email a été envoyé à <strong>${to}</strong> le ${date}
      </p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; width: 100px;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">De</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #111827; font-size: 14px;">${from}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Objet</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #111827; font-size: 14px; font-weight: 500;">${subject}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; vertical-align: top;">
            <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message</span>
          </td>
          <td style="padding: 12px 0;">
            <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin-top: 4px;">
              <p style="color: #111827; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${textBody}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Notification automatique — Starlinko Support
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
        from: "Starlinko Support <support@ranki.ai>",
        to: [NOTIFY_EMAIL],
        reply_to: senderEmail || undefined,
        subject: `[Support] ${subject}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[Inbound Webhook] Resend error:", errorText);
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const result = await resendResponse.json();
    console.log("[Inbound Webhook] Notification sent to", NOTIFY_EMAIL, ":", result);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Inbound Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
