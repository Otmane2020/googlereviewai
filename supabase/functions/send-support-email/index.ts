import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL = "support@starlinko.com"; // Destination support

serve(async (req) => {
  // Handle CORS preflight
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
      bug: "🐛 Bug / Problème technique",
      sync: "🔄 Synchronisation Google",
      billing: "💳 Facturation / Abonnement",
      feature: "💡 Suggestion de fonctionnalité",
      account: "👤 Problème de compte",
      other: "❓ Autre",
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nouvelle demande support</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <strong style="color: #64748b;">Email utilisateur:</strong><br>
                <span style="color: #1e293b;">${email || "Non connecté"}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <strong style="color: #64748b;">Type de demande:</strong><br>
                <span style="color: #1e293b;">${issueLabels[issueType] || issueType}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <strong style="color: #64748b;">Titre:</strong><br>
                <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${title}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <strong style="color: #64748b;">Description:</strong><br>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 8px; border: 1px solid #e2e8f0;">
                  <p style="color: #1e293b; margin: 0; white-space: pre-wrap;">${description}</p>
                </div>
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Envoyé depuis l'application Starlinko
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email via Resend
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
