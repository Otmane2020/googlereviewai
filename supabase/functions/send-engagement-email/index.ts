import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = "activate_auto_reply" | "pending_reviews" | "low_credits" | "weekly_summary" | "no_credits_upgrade";

interface EngagementEmailRequest {
  email: string;
  name?: string;
  type: EmailType;
  data?: {
    pending_count?: number;
    credits?: number;
    reviews_responded?: number;
    reviews_published?: number;
  };
}

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
  warningBg: "#fef3c7",
  warningText: "#92400e",
  errorBg: "#fee2e2",
  errorText: "#991b1b",
  successBg: "#ecfdf5",
  successText: "#065f46",
};

const getProHeader = () => `
  <div style="background: ${STYLES.bgWhite}; padding: 32px 24px; border-bottom: 1px solid ${STYLES.borderLight};">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align: middle;">
          <img src="https://starlinko.lovable.app/favicon.png" width="32" height="32" alt="Starlinko" style="display: block;" />
        </td>
        <td style="vertical-align: middle; padding-left: 12px;">
          <span style="font-family: ${STYLES.fontFamily}; font-weight: 600; font-size: 18px; color: ${STYLES.textPrimary};">Starlinko</span>
        </td>
      </tr>
    </table>
  </div>
`;

const getProFooter = () => `
  <div style="padding: 24px; text-align: center; border-top: 1px solid ${STYLES.borderLight};">
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0 0 8px 0;">
      © 2025 Starlinko. Tous droits réservés.
    </p>
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0;">
      <a href="https://starlinko.lovable.app" style="color: ${STYLES.brandBlue}; text-decoration: none;">starlinko.lovable.app</a>
    </p>
  </div>
`;

const getProButton = (text: string, url: string) => `
  <a href="${url}" 
     style="display: inline-block; background-color: ${STYLES.brandBlue}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-family: ${STYLES.fontFamily}; font-size: 14px; font-weight: 500;">
    ${text}
  </a>
`;

const emailTemplates: Record<EmailType, (name: string, data?: EngagementEmailRequest["data"]) => { subject: string; html: string }> = {
  activate_auto_reply: (name) => ({
    subject: "Automatisez vos réponses aux avis",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Activez les réponses automatiques
      </h1>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour ${name},
      </p>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Les réponses automatiques vous permettent de répondre à vos avis clients 24h/24, sans intervention manuelle.
      </p>
      
      <div style="background: ${STYLES.bgLight}; border-radius: 6px; padding: 20px; margin: 24px 0; border-left: 3px solid ${STYLES.brandBlue};">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 14px; font-weight: 500; margin: 0 0 12px 0;">
          Fonctionnalités incluses :
        </p>
        <ul style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Réponses générées par IA selon le ton de votre entreprise</li>
          <li>Publication automatique sur Google (optionnel)</li>
          <li>Notification pour chaque nouvel avis</li>
          <li>Prévisualisation avant publication</li>
        </ul>
      </div>
      
      <div style="text-align: left; margin: 32px 0;">
        ${getProButton("Configurer les réponses automatiques", "https://starlinko.lovable.app/ai-settings")}
      </div>
    </div>
    ${getProFooter()}
  </div>
</body>
</html>
    `,
  }),

  pending_reviews: (name, data) => ({
    subject: `${data?.pending_count || 0} avis en attente de réponse`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Avis en attente de réponse
      </h1>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour ${name},
      </p>
      
      <div style="background: ${STYLES.warningBg}; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.warningText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Avis sans réponse
        </p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 600; margin: 0;">
          ${data?.pending_count || 0}
        </p>
      </div>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Répondre rapidement aux avis améliore votre visibilité sur Google et renforce la confiance de vos clients.
      </p>
      
      <div style="text-align: left; margin: 32px 0;">
        ${getProButton("Voir les avis", "https://starlinko.lovable.app/reviews")}
      </div>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
        Utilisez la fonction "Générer toutes les réponses" pour traiter plusieurs avis en un clic.
      </p>
    </div>
    ${getProFooter()}
  </div>
</body>
</html>
    `,
  }),

  low_credits: (name, data) => ({
    subject: "Crédits bientôt épuisés",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Crédits bientôt épuisés
      </h1>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour ${name},
      </p>
      
      <div style="background: ${STYLES.errorBg}; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.errorText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Crédits restants
        </p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 600; margin: 0;">
          ${data?.credits || 0}
        </p>
      </div>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Pour continuer à générer des réponses IA, rechargez vos crédits ou souscrivez à un abonnement.
      </p>
      
      <div style="text-align: left; margin: 32px 0;">
        ${getProButton("Voir les offres", "https://starlinko.lovable.app/select-plan")}
      </div>
    </div>
    ${getProFooter()}
  </div>
</body>
</html>
    `,
  }),

  no_credits_upgrade: (name, data) => ({
    subject: `${data?.pending_count || 0} avis sans réponse - Crédits épuisés`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Crédits épuisés
      </h1>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour ${name},
      </p>
      
      <div style="background: ${STYLES.errorBg}; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.errorText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Avis en attente
        </p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 600; margin: 0;">
          ${data?.pending_count || 0}
        </p>
      </div>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Les réponses automatiques sont en pause. Rechargez vos crédits pour reprendre le traitement automatique de vos avis.
      </p>
      
      <div style="text-align: left; margin: 32px 0;">
        ${getProButton("Recharger les crédits", "https://starlinko.lovable.app/select-plan")}
      </div>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
        Vous pouvez également <a href="https://starlinko.lovable.app/reviews" style="color: ${STYLES.brandBlue}; text-decoration: none;">répondre manuellement</a> depuis votre tableau de bord.
      </p>
    </div>
    ${getProFooter()}
  </div>
</body>
</html>
    `,
  }),

  weekly_summary: (name, data) => ({
    subject: "Résumé hebdomadaire",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Résumé hebdomadaire
      </h1>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour ${name},
      </p>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Voici l'activité de votre compte cette semaine :
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="width: 50%; padding: 0 8px 0 0;">
            <div style="background: ${STYLES.successBg}; border-radius: 6px; padding: 20px; text-align: center;">
              <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.successText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Réponses générées
              </p>
              <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 28px; font-weight: 600; margin: 0;">
                ${data?.reviews_responded || 0}
              </p>
            </div>
          </td>
          <td style="width: 50%; padding: 0 0 0 8px;">
            <div style="background: ${STYLES.bgLight}; border-radius: 6px; padding: 20px; text-align: center;">
              <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Publiées sur Google
              </p>
              <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 28px; font-weight: 600; margin: 0;">
                ${data?.reviews_published || 0}
              </p>
            </div>
          </td>
        </tr>
      </table>
      
      ${(data?.pending_count || 0) > 0 ? `
      <div style="background: ${STYLES.warningBg}; border-radius: 6px; padding: 16px; margin: 24px 0;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.warningText}; font-size: 14px; margin: 0;">
          ${data?.pending_count} avis en attente de réponse.
        </p>
      </div>
      ` : ''}
      
      <div style="text-align: left; margin: 32px 0;">
        ${getProButton("Voir le tableau de bord", "https://starlinko.lovable.app/dashboard")}
      </div>
    </div>
    ${getProFooter()}
  </div>
</body>
</html>
    `,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - skipping engagement email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, name, type, data }: EngagementEmailRequest = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Missing email or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = emailTemplates[type];
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Unknown email type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = name?.split(" ")[0] || "";
    const { subject, html } = template(firstName, data);

    console.log(`Sending ${type} email to ${email}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Starlinko <support@starlinko.app>",
        to: [email],
        subject,
        html,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", resData);
      return new Response(
        JSON.stringify({ success: false, error: resData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Engagement email sent successfully:", resData?.id);

    return new Response(
      JSON.stringify({ success: true, id: resData?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
