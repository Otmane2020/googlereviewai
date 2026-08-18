import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = "oben.rockman@gmail.com";
const BRAND_NAME = "Google Review AI";
const NOTIFICATION_FROM = `${BRAND_NAME} Mail <support@ranki.ai>`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const eventType = payload.type || "";
    if (eventType !== "email.received") {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload.data || {};
    const from = String(data.from || "Expéditeur inconnu");
    const subject = String(data.subject || "(sans objet)");
    const toEmails = asArray(data.to);
    const ccEmails = asArray(data.cc);
    const textBody = String(data.text || "");
    const htmlBody = String(data.html || "");
    const providerMessageId = String(data.email_id || data.id || payload.id || crypto.randomUUID());
    const senderEmail = from.match(/<([^>]+)>/)?.[1] || (from.includes("@") ? from : undefined);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase service configuration");
    const supabase = createClient(supabaseUrl, serviceKey);

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
      source: "receive-email-webhook",
      metadata: { event_type: eventType },
    });

    if (insertError?.code === "23505") {
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (insertError) throw insertError;

    const preview = textBody || htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "(aucun contenu)";
    const date = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
    const emailHtml = `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827">
      <div style="max-width:620px;margin:0 auto;background:#fff">
        <div style="height:4px;background:linear-gradient(90deg,#4285F4 0 25%,#EA4335 25% 50%,#FBBC05 50% 75%,#34A853 75%)"></div>
        <div style="padding:28px;border-bottom:1px solid #e5e7eb"><strong style="font-size:19px">${BRAND_NAME} · nouvel email reçu</strong></div>
        <div style="padding:28px"><p style="font-size:13px;color:#6b7280">${escapeHtml(date)}</p><p><strong>De :</strong> ${escapeHtml(from)}</p><p><strong>À :</strong> ${escapeHtml((toEmails.length ? toEmails : ["support@googlereviewai.com"]).join(", "))}</p><p><strong>Objet :</strong> ${escapeHtml(subject)}</p><div style="margin-top:20px;padding:18px;background:#f8fafc;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(preview)}</div><p style="margin-top:24px;font-size:12px;color:#9ca3af">Archivé dans /admin → Boîte de réception.</p></div>
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

    if (!resendResponse.ok) console.error("[Inbound legacy] notification failed:", await resendResponse.text());

    return new Response(JSON.stringify({ success: true, archived: true, notified: resendResponse.ok }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Receive Email Webhook] Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
