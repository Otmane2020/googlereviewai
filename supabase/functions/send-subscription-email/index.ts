import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  name?: string;
  plan_name: string;
  credits: number;
  max_businesses: number;
  billing_cycle: "month" | "year";
  is_trial: boolean;
  trial_days?: number;
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
  successBg: "#ecfdf5",
  successText: "#065f46",
  starterColor: "#3b82f6",
  proColor: "#8b5cf6",
  businessColor: "#f59e0b",
};

const getPlanColor = (planName: string): string => {
  const name = planName.toLowerCase();
  if (name.includes("business")) return STYLES.businessColor;
  if (name.includes("pro")) return STYLES.proColor;
  return STYLES.starterColor;
};

const getProHeader = () => `
  <div style="background: ${STYLES.bgWhite}; padding: 32px 24px; border-bottom: 1px solid ${STYLES.borderLight};">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align: middle;">
          <img src="https://starlinko.app/favicon.png" width="32" height="32" alt="Starlinko" style="display: block;" />
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
      <a href="https://starlinko.app" style="color: ${STYLES.brandBlue}; text-decoration: none;">starlinko.app</a>
      &nbsp;|&nbsp;
      <a href="https://starlinko.app/settings" style="color: ${STYLES.brandBlue}; text-decoration: none;">Gérer mon abonnement</a>
    </p>
  </div>
`;

const getProButton = (text: string, url: string) => `
  <a href="${url}" 
     style="display: inline-block; background-color: ${STYLES.brandBlue}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: ${STYLES.fontFamily}; font-size: 15px; font-weight: 500;">
    ${text}
  </a>
`;

const getPlanBadge = (planName: string) => {
  const color = getPlanColor(planName);
  return `
    <span style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-family: ${STYLES.fontFamily}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
      ${planName}
    </span>
  `;
};

const getPlanFeatures = (planName: string, credits: number, maxBusinesses: number): string[] => {
  const name = planName.toLowerCase();
  const baseFeatures = [
    `${credits} crédits IA / mois`,
    `${maxBusinesses === 999 ? "Établissements illimités" : `${maxBusinesses} établissement${maxBusinesses > 1 ? "s" : ""}`}`,
    "Réponses automatiques 24h/24",
    "Publication sur Google My Business",
  ];
  
  if (name.includes("pro") || name.includes("business")) {
    baseFeatures.push("Support prioritaire");
  }
  
  if (name.includes("business")) {
    baseFeatures.push("Rapports d'analyse avancés");
    baseFeatures.push("API access");
  }
  
  return baseFeatures;
};

const getNextSteps = (planName: string): string => {
  const name = planName.toLowerCase();
  
  const steps = [
    { icon: "1️⃣", text: "Connectez votre compte Google Business Profile" },
    { icon: "2️⃣", text: "Synchronisez vos avis clients" },
    { icon: "3️⃣", text: "Configurez le ton et le style des réponses IA" },
  ];
  
  if (name.includes("pro") || name.includes("business")) {
    steps.push({ icon: "4️⃣", text: "Activez la publication automatique sur Google" });
  }
  
  return steps.map(step => `
    <tr>
      <td style="padding: 8px 0; font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.6;">
        <span style="margin-right: 8px;">${step.icon}</span> ${step.text}
      </td>
    </tr>
  `).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - skipping subscription email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      email, 
      name, 
      plan_name, 
      credits, 
      max_businesses, 
      billing_cycle,
      is_trial,
      trial_days = 3
    }: SubscriptionEmailRequest = await req.json();

    if (!email || !plan_name) {
      return new Response(
        JSON.stringify({ error: "Missing email or plan_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = name?.split(" ")[0] || "";
    const planColor = getPlanColor(plan_name);
    const features = getPlanFeatures(plan_name, credits, max_businesses);
    const billingText = billing_cycle === "year" ? "annuel" : "mensuel";
    
    const subject = is_trial 
      ? `🎉 Votre essai gratuit ${plan_name} est activé !`
      : `Bienvenue dans votre abonnement ${plan_name} !`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    
    <div style="padding: 40px 32px;">
      <!-- Success Banner -->
      <div style="background: linear-gradient(135deg, ${planColor}15 0%, ${planColor}05 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center; border: 1px solid ${planColor}30;">
        ${is_trial ? `
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; margin: 0 0 12px 0;">
          🎁 Essai gratuit de ${trial_days} jours
        </p>
        ` : ""}
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 28px; font-weight: 700; margin: 0 0 12px 0;">
          ${plan_name}
        </p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; margin: 0;">
          Abonnement ${billingText}
        </p>
      </div>

      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour${firstName ? ` ${firstName}` : ""} 👋
      </p>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        ${is_trial 
          ? `Merci d'avoir choisi Starlinko ! Votre essai gratuit de <strong>${trial_days} jours</strong> est maintenant actif.`
          : `Félicitations ! Votre abonnement <strong>${plan_name}</strong> est maintenant actif.`
        }
      </p>

      <!-- Plan Features -->
      <div style="background: ${STYLES.bgLight}; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">
          Ce qui est inclus :
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          ${features.map(feature => `
          <tr>
            <td style="padding: 8px 0; font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.6;">
              <span style="color: ${STYLES.successText}; margin-right: 8px;">✓</span> ${feature}
            </td>
          </tr>
          `).join("")}
        </table>
      </div>

      <!-- Credits Display -->
      <div style="background: ${STYLES.successBg}; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.successText}; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Crédits disponibles
        </p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 700; margin: 0;">
          ${credits}
        </p>
      </div>

      <!-- Next Steps -->
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 15px; font-weight: 600; margin: 32px 0 16px 0;">
        Prochaines étapes :
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        ${getNextSteps(plan_name)}
      </table>
      
      <div style="text-align: center; margin: 40px 0;">
        ${getProButton("Commencer maintenant", "https://starlinko.app/dashboard")}
      </div>

      ${is_trial ? `
      <div style="background: #fef3c7; border-radius: 6px; padding: 16px; margin: 24px 0; border-left: 3px solid #f59e0b;">
        <p style="font-family: ${STYLES.fontFamily}; color: #92400e; font-size: 14px; margin: 0;">
          ⏰ Votre essai se termine dans <strong>${trial_days} jours</strong>. Après cette période, votre carte sera automatiquement débitée.
        </p>
      </div>
      ` : ""}
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
        Des questions ? Répondez directement à cet email ou contactez-nous à 
        <a href="mailto:support@ranki.ai" style="color: ${STYLES.brandBlue}; text-decoration: none;">support@ranki.ai</a>
      </p>
    </div>
    
    ${getProFooter()}
  </div>
</body>
</html>
    `;

    console.log(`Sending subscription email to ${email} for plan ${plan_name} (trial: ${is_trial})`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Starlinko <support@ranki.ai>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ success: false, error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Subscription email sent successfully:", data.id);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
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
