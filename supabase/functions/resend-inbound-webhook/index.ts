import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = "oben.rockman@gmail.com";
const BRAND_NAME = "Google Review AI";
// Technical domain stays on the currently verified sender until the new domain is verified.
const NOTIFICATION_FROM = `${BRAND_NAME} Mail <support@ranki.ai>`;

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const eventType = String(payload.type || "");
    const data = payload.data || {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase service configuration");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Central sent-mail archive for direct Resend sends (welcome, subscription, support, etc.).
    if (["email.sent", "email.delivered"].includes(eventType)) {
      const providerMessageId = String(data.email_id || data.id || payload.id || crypto.randomUUID());
      const status = eventType === "email.delivered" ? "delivered" : "sent";
      const { error } = await supabase.from("email_messages").upsert({
        provider_message_id: `resend:${providerMessageId}`,
        direction: "outbound",
        from_email: String(data.from || `${BRAND_NAME}`),
        to_emails: asArray(data.to),
        cc_emails: asArray(data.cc),
        subject: String(data.subject || "(sans objet)"),
        text_body: typeof data.text === "string" ? data.text : null,
        html_body: typeof data.html === "string" ? data.html : null,
        status,
        source: "resend-event-webhook",
        metadata: { event_type: eventType },
      }, { onConflict: "provider_message_id" });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, archived: "outbound" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (eventType !== "email.received") {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const from = String(data.from || payload.from || "Expéditeur inconnu");
    const subject = String(data.subject || payload.subject || "(sans objet)");
    const textBody = String(data.text || payload.text || "");
    const htmlBody = String(data.html || payload.html || "");
    const toEmails = asArray(data.to || payload.to);
    const ccEmails = asArray(data.cc || payload.cc);
    const providerMessageId = String(data.email_id || data.id || payload.id || crypto.randomUUID());
    const senderEmail = from.match(/<([^>]+)>/)?.[1] || (from.includes("@") ? from : undefined);

    const { error: insertError } = await supabase.from("email_messages").insert({
      provider_message_id: providerMessageId,
      direction: "inbound",
      from_email: from,
      to_emails: toEmails.length ? toEmails : ["support@googlereviewai.com"],
      cc_emails: ccEmails,
      subject,
      text_body: textBody || null,
      html_body: htmlBody || null,
      status: "received",
      source: "resend-inbound-webhook",
      metadata: { event_type: eventType },
    });

    // Prevent duplicate inbox rows and duplicate Gmail notifications if two endpoints receive the same event.
    if (insertError?.code === "23505") {
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (insertError) throw insertError;

    const date = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
    const preview = textBody || htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "(aucun contenu)";
    const emailHtml = `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827">
      <div style="max-width:620px;margin:0 auto;background:#fff">
        <div style="height:4px;background:linear-gradient(90deg,#4285F4 0 25%,#EA4335 25% 50%,#FBBC05 50% 75%,#34A853 75%)"></div>
        <div style="padding:28px 28px 18px;border-bottom:1px solid #e5e7eb"><strong style="font-size:19px">${BRAND_NAME} · nouvel email reçu</strong></div>
        <div style="padding:28px">
          <p style="color:#6b7280;font-size:13px">Reçu le ${escapeHtml(date)}</p>
          <p><strong>De :</strong> ${escapeHtml(from)}</p>
          <p><strong>À :</strong> ${escapeHtml((toEmails.length ? toEmails : ["support@googlereviewai.com"]).join(", "))}</p>
          <p><strong>Objet :</strong> ${escapeHtml(subject)}</p>
          <div style="margin-top:20px;padding:18px;background:#f8fafc;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(preview)}</div>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af">Le message complet est aussi archivé dans /admin → Boîte de réception.</p>
        </div>
      </div></body></html>`;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: NOTIFICATION_FROM,
        to: [NOTIFY_EMAIL],
        reply_to: senderEmail || undefined,
        subject: `[${BRAND_NAME}] ${subject}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      console.error("[Inbound] admin notification failed:", await resendResponse.text());
    }

    return new Response(JSON.stringify({ success: true, archived: true, notified: resendResponse.ok }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Email webhook] Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
