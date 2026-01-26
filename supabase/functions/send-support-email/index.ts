import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL = "support@starlinko.com";

// Professional email design system
const STYLES = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgWhite: "#ffffff",
  bgLight: "#f9fafb",
  borderLight: "#e5e7eb",
  brandBlue: "#2563eb",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, title, description, issueType } = await req.json();

    console.log("[Support] New support request:", { email, title, issueType });

    if (!title || !description || !issueType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const issueLabels: Record<string, string> = {
      bug: "Bug / Problème technique",
      sync: "Synchronisation Google",
      billing: "Facturation / Abonnement",
      feature: "Suggestion de fonctionnalité",
      account: "Problème de compte",
      other: "Autre",
    };

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    <div style="background: ${STYLES.bgWhite}; padding: 32px 24px; border-bottom: 1px solid ${STYLES.borderLight};">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;">
            <img src="https://starlinko.app/favicon.png" width="32" height="32" alt="Starlinko" style="display: block;" />
          </td>
          <td style="vertical-align: middle; padding-left: 12px;">
            <span style="font-family: ${STYLES.fontFamily}; font-weight: 600; font-size: 18px; color: ${STYLES.textPrimary};">Starlinko Support</span>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="padding: 32px 24px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 20px; font-weight: 600; margin: 0 0 24px 0;">
        Nouvelle demande support
      </h1>
      
      <table style="width: 100%; border-collapse: collapse; font-family: ${STYLES.fontFamily};">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${STYLES.borderLight}; vertical-align: top; width: 140px;">
            <span style="color: ${STYLES.textMuted}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid ${STYLES.borderLight};">
            <span style="color: ${STYLES.textPrimary}; font-size: 14px;">${email || "Non connecté"}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${STYLES.borderLight}; vertical-align: top;">
            <span style="color: ${STYLES.textMuted}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Type</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid ${STYLES.borderLight};">
            <span style="color: ${STYLES.textPrimary}; font-size: 14px;">${issueLabels[issueType] || issueType}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${STYLES.borderLight}; vertical-align: top;">
            <span style="color: ${STYLES.textMuted}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Titre</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid ${STYLES.borderLight};">
            <span style="color: ${STYLES.textPrimary}; font-size: 14px; font-weight: 500;">${title}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; vertical-align: top;">
            <span style="color: ${STYLES.textMuted}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Description</span>
          </td>
          <td style="padding: 12px 0;">
            <div style="background: ${STYLES.bgLight}; padding: 16px; border-radius: 6px; margin-top: 4px;">
              <p style="color: ${STYLES.textPrimary}; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="padding: 16px 24px; text-align: center; border-top: 1px solid ${STYLES.borderLight};">
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0;">
        Envoyé depuis l'application Starlinko
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
        from: "Starlinko Support <noreply@starlinko.com>",
        to: [SUPPORT_EMAIL],
        reply_to: email || undefined,
        subject: `[Support] ${issueLabels[issueType] || issueType}: ${title}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[Support] Resend error:", errorText);
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const result = await resendResponse.json();
    console.log("[Support] Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Support] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
