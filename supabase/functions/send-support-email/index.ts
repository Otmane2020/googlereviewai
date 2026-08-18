import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL = "oben.rockman@gmail.com";
// ranki.ai remains only as the currently verified technical sending domain.
const FROM_EMAIL = "Google Review AI Support <support@ranki.ai>";

const STYLES = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgWhite: "#ffffff",
  bgLight: "#f9fafb",
  borderLight: "#e5e7eb",
  brandBlue: "#4285F4",
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, title, description, issueType } = await req.json();
    if (!title || !description || !issueType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const issueLabels: Record<string, string> = {
      bug: "Bug / Problème technique",
      sync: "Synchronisation Google",
      billing: "Facturation / Abonnement",
      feature: "Suggestion de fonctionnalité",
      account: "Problème de compte",
      other: "Autre",
    };

    const label = issueLabels[issueType] || issueType;
    const emailHtml = `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:${STYLES.bgLight};font-family:${STYLES.fontFamily}">
      <div style="max-width:600px;margin:0 auto;background:${STYLES.bgWhite}">
        <div style="height:4px;background:linear-gradient(90deg,#4285F4 0 25%,#EA4335 25% 50%,#FBBC05 50% 75%,#34A853 75%)"></div>
        <div style="padding:28px 24px;border-bottom:1px solid ${STYLES.borderLight}"><span style="font-weight:650;font-size:19px;color:${STYLES.textPrimary}">Google Review AI Support</span></div>
        <div style="padding:32px 24px">
          <h1 style="color:${STYLES.textPrimary};font-size:20px;margin:0 0 24px">Nouvelle demande support</h1>
          <p style="color:${STYLES.textSecondary};font-size:14px"><strong>Email :</strong> ${escapeHtml(email || "Non connecté")}</p>
          <p style="color:${STYLES.textSecondary};font-size:14px"><strong>Type :</strong> ${escapeHtml(label)}</p>
          <p style="color:${STYLES.textSecondary};font-size:14px"><strong>Titre :</strong> ${escapeHtml(title)}</p>
          <div style="background:${STYLES.bgLight};padding:16px;border-radius:8px;color:${STYLES.textPrimary};font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(description)}</div>
        </div>
        <div style="padding:16px 24px;text-align:center;border-top:1px solid ${STYLES.borderLight};color:${STYLES.textMuted};font-size:12px">Envoyé depuis Google Review AI · googlereviewai.com</div>
      </div></body></html>`;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SUPPORT_EMAIL],
        reply_to: email || undefined,
        subject: `[Google Review AI Support] ${label}: ${title}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) throw new Error(`Resend API error: ${resendResponse.status} ${await resendResponse.text()}`);
    const result = await resendResponse.json();
    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Support] Error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
