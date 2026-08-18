import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = "oben.rockman@gmail.com";
const SUPPORT_EMAIL = "support@googlereviewai.com";
const BRAND_NAME = "Google Review AI";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const payload = await req.json();
    const eventType = payload.type || "";
    if (eventType !== "email.received") {
      return new Response(JSON.stringify({ success: true, ignored: true, eventType }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload.data || {};
    const from = String(data.from || payload.from || "Unknown sender");
    const subject = String(data.subject || payload.subject || "(no subject)");
    const to = Array.isArray(data.to)
      ? data.to.map(String).join(", ")
      : String(data.to || payload.to || SUPPORT_EMAIL);
    const textBody = String(data.text || payload.text || "");
    const htmlBody = String(data.html || payload.html || "");
    const preview = textBody || htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "(message body not included in webhook payload)";
    const senderEmail = from.match(/<([^>]+)>/)?.[1] || (from.includes("@") ? from : undefined);
    const date = new Date().toLocaleString("en-GB", { timeZone: "Europe/Paris" });

    const emailHtml = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827">
      <div style="max-width:620px;margin:0 auto;background:#fff">
        <div style="height:4px;background:linear-gradient(90deg,#4285F4 0 25%,#EA4335 25% 50%,#FBBC05 50% 75%,#34A853 75%)"></div>
        <div style="padding:26px 28px;border-bottom:1px solid #e5e7eb"><strong style="font-size:19px">${BRAND_NAME} · New support email</strong></div>
        <div style="padding:28px">
          <p style="font-size:13px;color:#6b7280">Received ${escapeHtml(date)}</p>
          <p><strong>From:</strong> ${escapeHtml(from)}</p>
          <p><strong>To:</strong> ${escapeHtml(to)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <div style="margin-top:20px;padding:18px;background:#f8fafc;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(preview)}</div>
        </div>
      </div>
    </body></html>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${BRAND_NAME} Support <${SUPPORT_EMAIL}>`,
        to: [NOTIFY_EMAIL],
        reply_to: senderEmail || undefined,
        subject: `[Google Review AI Support] ${subject}`,
        html: emailHtml,
      }),
    });

    const responseText = await resendResponse.text();
    if (!resendResponse.ok) {
      console.error("[Receive Email Webhook] notification failed:", responseText);
      return new Response(JSON.stringify({ success: false, notified: false, providerStatus: resendResponse.status, providerError: responseText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[Receive Email Webhook] notification sent to", NOTIFY_EMAIL, responseText);
    return new Response(JSON.stringify({ success: true, notified: true, notifyEmail: NOTIFY_EMAIL }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Receive Email Webhook] error:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
