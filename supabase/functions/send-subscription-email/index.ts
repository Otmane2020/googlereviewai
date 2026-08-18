import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveEmailLang, type Lang } from "../_shared/email-lang.ts";

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
  lang?: Lang;
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
          <img src="https://googlereviewai.com/favicon.png" width="32" height="32" alt="GoogleReviewAI" style="display: block;" />
        </td>
        <td style="vertical-align: middle; padding-left: 12px;">
          <span style="font-family: ${STYLES.fontFamily}; font-weight: 600; font-size: 18px; color: ${STYLES.textPrimary};">GoogleReviewAI</span>
        </td>
      </tr>
    </table>
  </div>
`;

const T = {
  fr: {
    rights: "Tous droits réservés.",
    manage: "Gérer mon abonnement",
    creditsMonth: (c: number) => `${c} crédits IA / mois`,
    biz: (n: number) => n === 999 ? "Établissements illimités" : `${n} établissement${n > 1 ? "s" : ""}`,
    autoReplies: "Réponses automatiques 24h/24",
    publishGmb: "Publication sur Google My Business",
    prioSupport: "Support prioritaire",
    advReports: "Rapports d'analyse avancés",
    apiAccess: "API access",
    step1: "Connectez votre compte Google Business Profile",
    step2: "Synchronisez vos avis clients",
    step3: "Configurez le ton et le style des réponses IA",
    step4: "Activez la publication automatique sur Google",
    subjTrial: (p: string) => `🎉 Votre essai gratuit ${p} est activé !`,
    subjActive: (p: string) => `Bienvenue dans votre abonnement ${p} !`,
    trialBanner: (d: number) => `🎁 Essai gratuit de ${d} jours`,
    billing: (c: string) => `Abonnement ${c === "year" ? "annuel" : "mensuel"}`,
    hello: "Bonjour",
    introTrial: (d: number) => `Merci d'avoir choisi GoogleReviewAI ! Votre essai gratuit de <strong>${d} jours</strong> est maintenant actif.`,
    introActive: (p: string) => `Félicitations ! Votre abonnement <strong>${p}</strong> est maintenant actif.`,
    included: "Ce qui est inclus :",
    creditsAvail: "Crédits disponibles",
    nextSteps: "Prochaines étapes :",
    cta: "Commencer maintenant",
    trialEnd: (d: number) => `⏰ Votre essai se termine dans <strong>${d} jours</strong>. Après cette période, votre carte sera automatiquement débitée.`,
    questions: "Des questions ? Répondez directement à cet email ou contactez-nous à",
  },
  en: {
    rights: "All rights reserved.",
    manage: "Manage my subscription",
    creditsMonth: (c: number) => `${c} AI credits / month`,
    biz: (n: number) => n === 999 ? "Unlimited businesses" : `${n} business${n > 1 ? "es" : ""}`,
    autoReplies: "24/7 automatic replies",
    publishGmb: "Publishing to Google Business Profile",
    prioSupport: "Priority support",
    advReports: "Advanced analytics reports",
    apiAccess: "API access",
    step1: "Connect your Google Business Profile",
    step2: "Sync your customer reviews",
    step3: "Configure AI reply tone and style",
    step4: "Enable automatic publishing to Google",
    subjTrial: (p: string) => `🎉 Your ${p} free trial is active!`,
    subjActive: (p: string) => `Welcome to your ${p} subscription!`,
    trialBanner: (d: number) => `🎁 ${d}-day free trial`,
    billing: (c: string) => `${c === "year" ? "Yearly" : "Monthly"} subscription`,
    hello: "Hello",
    introTrial: (d: number) => `Thanks for choosing GoogleReviewAI! Your <strong>${d}-day</strong> free trial is now active.`,
    introActive: (p: string) => `Congrats! Your <strong>${p}</strong> subscription is now active.`,
    included: "What's included:",
    creditsAvail: "Available credits",
    nextSteps: "Next steps:",
    cta: "Get started",
    trialEnd: (d: number) => `⏰ Your trial ends in <strong>${d} days</strong>. Your card will then be charged automatically.`,
    questions: "Questions? Reply to this email or contact us at",
  },
};

const getProFooter = (t: typeof T.fr) => `
  <div style="padding: 24px; text-align: center; border-top: 1px solid ${STYLES.borderLight};">
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0 0 8px 0;">
      © 2025 GoogleReviewAI. ${t.rights}
    </p>
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0;">
      <a href="https://googlereviewai.com" style="color: ${STYLES.brandBlue}; text-decoration: none;">googlereviewai.com</a>
      &nbsp;|&nbsp;
      <a href="https://googlereviewai.com/settings" style="color: ${STYLES.brandBlue}; text-decoration: none;">${t.manage}</a>
    </p>
  </div>
`;

const getProButton = (text: string, url: string) => `
  <a href="${url}"
     style="display: inline-block; background-color: ${STYLES.brandBlue}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: ${STYLES.fontFamily}; font-size: 15px; font-weight: 500;">
    ${text}
  </a>
`;

const getPlanFeatures = (planName: string, credits: number, maxBusinesses: number, t: typeof T.fr): string[] => {
  const name = planName.toLowerCase();
  const baseFeatures = [
    t.creditsMonth(credits),
    t.biz(maxBusinesses),
    t.autoReplies,
    t.publishGmb,
  ];
  if (name.includes("pro") || name.includes("business")) baseFeatures.push(t.prioSupport);
  if (name.includes("business")) { baseFeatures.push(t.advReports); baseFeatures.push(t.apiAccess); }
  return baseFeatures;
};

const getNextSteps = (planName: string, t: typeof T.fr): string => {
  const name = planName.toLowerCase();
  const steps = [
    { icon: "1️⃣", text: t.step1 },
    { icon: "2️⃣", text: t.step2 },
    { icon: "3️⃣", text: t.step3 },
  ];
  if (name.includes("pro") || name.includes("business")) steps.push({ icon: "4️⃣", text: t.step4 });
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

    const body: SubscriptionEmailRequest = await req.json();
    const { email, name, plan_name, credits, max_businesses, billing_cycle, is_trial, trial_days = 3 } = body;

    if (!email || !plan_name) {
      return new Response(
        JSON.stringify({ error: "Missing email or plan_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = await resolveEmailLang(email, body.lang);
    const t = T[lang];
    const firstName = name?.split(" ")[0] || "";
    const planColor = getPlanColor(plan_name);
    const features = getPlanFeatures(plan_name, credits, max_businesses, t);

    const subject = is_trial ? t.subjTrial(plan_name) : t.subjActive(plan_name);

    const htmlContent = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <div style="background: linear-gradient(135deg, ${planColor}15 0%, ${planColor}05 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center; border: 1px solid ${planColor}30;">
        ${is_trial ? `<p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; margin: 0 0 12px 0;">${t.trialBanner(trial_days)}</p>` : ""}
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 28px; font-weight: 700; margin: 0 0 12px 0;">${plan_name}</p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; margin: 0;">${t.billing(billing_cycle)}</p>
      </div>
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">${t.hello}${firstName ? ` ${firstName}` : ""} 👋</p>
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${is_trial ? t.introTrial(trial_days) : t.introActive(plan_name)}</p>
      <div style="background: ${STYLES.bgLight}; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">${t.included}</p>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          ${features.map(f => `<tr><td style="padding: 8px 0; font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.6;"><span style="color: ${STYLES.successText}; margin-right: 8px;">✓</span> ${f}</td></tr>`).join("")}
        </table>
      </div>
      <div style="background: ${STYLES.successBg}; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.successText}; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.creditsAvail}</p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 700; margin: 0;">${credits}</p>
      </div>
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 15px; font-weight: 600; margin: 32px 0 16px 0;">${t.nextSteps}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">${getNextSteps(plan_name, t)}</table>
      <div style="text-align: center; margin: 40px 0;">${getProButton(t.cta, "https://googlereviewai.com/dashboard")}</div>
      ${is_trial ? `<div style="background: #fef3c7; border-radius: 6px; padding: 16px; margin: 24px 0; border-left: 3px solid #f59e0b;"><p style="font-family: ${STYLES.fontFamily}; color: #92400e; font-size: 14px; margin: 0;">${t.trialEnd(trial_days)}</p></div>` : ""}
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">${t.questions} <a href="mailto:support@ranki.ai" style="color: ${STYLES.brandBlue}; text-decoration: none;">support@ranki.ai</a></p>
    </div>
    ${getProFooter(t)}
  </div>
</body>
</html>`;

    console.log(`Sending subscription email to ${email} for plan ${plan_name} (trial: ${is_trial})`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GoogleReviewAI <support@ranki.ai>",
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
