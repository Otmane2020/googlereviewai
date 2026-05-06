import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  plan_name?: string;
  credits?: number;
  is_trial?: boolean;
  lang?: "fr" | "en";
}

const T = {
  fr: {
    footerRights: "Tous droits réservés.",
    welcomeTitle: "Bienvenue sur Starlinko ! 🚀",
    hello: "Bonjour",
    thanksSub: (plan: string) => `Merci pour votre confiance ! Votre abonnement <strong>${plan}</strong> est maintenant actif.`,
    accountCreated: "Votre compte a été créé avec succès. Vous pouvez désormais gérer vos avis Google et générer des réponses professionnelles grâce à l'intelligence artificielle.",
    trialActivated: "🎁 Essai gratuit activé",
    creditsAvailable: "Crédits disponibles",
    toStart: "Pour commencer :",
    step1: "Connectez votre compte Google My Business",
    step2: "Synchronisez vos avis clients",
    step3: "Générez des réponses personnalisées en un clic",
    cta: "Accéder au tableau de bord",
    questions: "Des questions ? Répondez directement à cet email, nous sommes là pour vous aider.",
    subjectSub: (name: string, plan: string) => `🎉 Bienvenue ${name ? name + " " : ""}! Votre abonnement ${plan} est actif`,
    subjectFree: "Bienvenue sur Starlinko - Gérez vos avis avec l'IA",
    freePlan: "Gratuit",
  },
  en: {
    footerRights: "All rights reserved.",
    welcomeTitle: "Welcome to Starlinko! 🚀",
    hello: "Hello",
    thanksSub: (plan: string) => `Thank you for your trust! Your <strong>${plan}</strong> subscription is now active.`,
    accountCreated: "Your account was created successfully. You can now manage your Google reviews and generate professional AI-powered responses.",
    trialActivated: "🎁 Free trial activated",
    creditsAvailable: "Available credits",
    toStart: "To get started:",
    step1: "Connect your Google My Business account",
    step2: "Sync your customer reviews",
    step3: "Generate personalized replies in one click",
    cta: "Go to dashboard",
    questions: "Questions? Just reply to this email — we're here to help.",
    subjectSub: (name: string, plan: string) => `🎉 Welcome ${name ? name + " " : ""}! Your ${plan} subscription is active`,
    subjectFree: "Welcome to Starlinko — manage your reviews with AI",
    freePlan: "Free",
  },
};


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

const getProFooter = (rights: string) => `
  <div style="padding: 24px; text-align: center; border-top: 1px solid ${STYLES.borderLight};">
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0 0 8px 0;">
      © 2025 Starlinko. ${rights}
    </p>
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0;">
      <a href="https://starlinko.app" style="color: ${STYLES.brandBlue}; text-decoration: none;">starlinko.app</a>
    </p>
  </div>
`;

const getProButton = (text: string, url: string) => `
  <a href="${url}" 
     style="display: inline-block; background-color: ${STYLES.brandBlue}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-family: ${STYLES.fontFamily}; font-size: 15px; font-weight: 500;">
    ${text}
  </a>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - skipping welcome email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, name, plan_name, credits, is_trial, lang: bodyLang }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let lang: "fr" | "en" = bodyLang === "en" || bodyLang === "fr" ? bodyLang : "fr";
    if (!bodyLang) {
      try {
        const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: prof } = await supa.from("profiles").select("preferred_language").eq("email", email).maybeSingle();
        if (prof?.preferred_language === "en") lang = "en";
      } catch (_) { /* keep default */ }
    }
    const t = T[lang];

    const firstName = name?.split(" ")[0] || "";
    const hasSubscription = !!plan_name;
    const displayCredits = credits ?? 10;
    const displayPlan = plan_name || t.freePlan;

    console.log(`Sending welcome email to ${email} (lang=${lang}, plan: ${displayPlan})`);

    let planSection = "";
    if (hasSubscription) {
      planSection = `
      <div style="background: linear-gradient(135deg, ${STYLES.brandBlue}15 0%, ${STYLES.brandBlue}05 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid ${STYLES.brandBlue}30;">
        ${is_trial ? `<p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 13px; margin: 0 0 8px 0;">${t.trialActivated}</p>` : ""}
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 700; margin: 0;">${displayPlan}</p>
      </div>`;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 26px; font-weight: 600; margin: 0 0 24px 0;">${t.welcomeTitle}</h1>
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">${t.hello}${firstName ? ` ${firstName}` : ""} 👋</p>
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${hasSubscription ? t.thanksSub(displayPlan) : t.accountCreated}</p>
      ${planSection}
      <div style="background: ${STYLES.successBg}; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.successText}; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.creditsAvailable}</p>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 700; margin: 0;">${displayCredits}</p>
      </div>
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">${t.toStart}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.6;"><span style="margin-right: 8px;">1️⃣</span> ${t.step1}</td></tr>
        <tr><td style="padding: 8px 0; font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.6;"><span style="margin-right: 8px;">2️⃣</span> ${t.step2}</td></tr>
        <tr><td style="padding: 8px 0; font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.6;"><span style="margin-right: 8px;">3️⃣</span> ${t.step3}</td></tr>
      </table>
      <div style="text-align: center; margin: 32px 0;">${getProButton(t.cta, "https://starlinko.app/dashboard")}</div>
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">${t.questions}</p>
    </div>
    ${getProFooter(t.footerRights)}
  </div>
</body>
</html>`;

    const subject = hasSubscription ? t.subjectSub(firstName, displayPlan) : t.subjectFree;

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
    console.log("Welcome email sent successfully:", data.id);

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
