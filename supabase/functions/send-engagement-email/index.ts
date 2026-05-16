import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveEmailLang, type Lang } from "../_shared/email-lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = "activate_auto_reply" | "pending_reviews" | "low_credits" | "weekly_summary" | "no_credits_upgrade";

interface EngagementEmailRequest {
  email: string;
  name?: string;
  type: EmailType;
  lang?: Lang;
  user_id?: string;
  data?: {
    pending_count?: number;
    credits?: number;
    reviews_responded?: number;
    reviews_published?: number;
  };
}

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

const T = {
  fr: {
    rights: "Tous droits réservés.",
    hello: "Bonjour",
    activateSubject: "Automatisez vos réponses aux avis",
    activateTitle: "Activez les réponses automatiques",
    activateBody: "Les réponses automatiques vous permettent de répondre à vos avis clients 24h/24, sans intervention manuelle.",
    included: "Fonctionnalités incluses :",
    f1: "Réponses générées par IA selon le ton de votre entreprise",
    f2: "Publication automatique sur Google (optionnel)",
    f3: "Notification pour chaque nouvel avis",
    f4: "Prévisualisation avant publication",
    configure: "Configurer les réponses automatiques",
    pendingSubject: (n: number) => `${n} avis en attente de réponse`,
    pendingTitle: "Avis en attente de réponse",
    unanswered: "Avis sans réponse",
    pendingBody: "Répondre rapidement aux avis améliore votre visibilité sur Google et renforce la confiance de vos clients.",
    viewReviews: "Voir les avis",
    bulkTip: "Utilisez la fonction \"Générer toutes les réponses\" pour traiter plusieurs avis en un clic.",
    lowSubject: "Crédits bientôt épuisés",
    lowTitle: "Crédits bientôt épuisés",
    remainingCredits: "Crédits restants",
    lowBody: "Pour continuer à générer des réponses IA, rechargez vos crédits ou souscrivez à un abonnement.",
    seePlans: "Voir les offres",
    noCreditsSubject: (n: number) => `${n} avis sans réponse - Crédits épuisés`,
    noCreditsTitle: "Crédits épuisés",
    pendingReviews: "Avis en attente",
    noCreditsBody: "Les réponses automatiques sont en pause. Rechargez vos crédits pour reprendre le traitement automatique de vos avis.",
    topUp: "Recharger les crédits",
    manualReply: "Vous pouvez également répondre manuellement depuis votre tableau de bord.",
    weeklySubject: "Résumé hebdomadaire",
    weeklyTitle: "Résumé hebdomadaire",
    weeklyIntro: "Voici l'activité de votre compte cette semaine :",
    generatedReplies: "Réponses générées",
    publishedGoogle: "Publiées sur Google",
    pendingLine: (n: number) => `${n} avis en attente de réponse.`,
    dashboard: "Voir le tableau de bord",
  },
  en: {
    rights: "All rights reserved.",
    hello: "Hello",
    activateSubject: "Automate your review replies",
    activateTitle: "Enable automatic replies",
    activateBody: "Automatic replies let you respond to customer reviews 24/7 without manual work.",
    included: "Included features:",
    f1: "AI-generated replies matching your business tone",
    f2: "Automatic publishing to Google (optional)",
    f3: "Notification for every new review",
    f4: "Preview before publishing",
    configure: "Configure automatic replies",
    pendingSubject: (n: number) => `${n} review${n > 1 ? "s" : ""} awaiting a reply`,
    pendingTitle: "Reviews awaiting a reply",
    unanswered: "Unanswered reviews",
    pendingBody: "Replying quickly to reviews improves your visibility on Google and strengthens customer trust.",
    viewReviews: "View reviews",
    bulkTip: "Use \"Generate all replies\" to handle several reviews in one click.",
    lowSubject: "Credits are running low",
    lowTitle: "Credits are running low",
    remainingCredits: "Credits remaining",
    lowBody: "To keep generating AI replies, top up your credits or subscribe to a plan.",
    seePlans: "View plans",
    noCreditsSubject: (n: number) => `${n} unanswered review${n > 1 ? "s" : ""} - Credits exhausted`,
    noCreditsTitle: "Credits exhausted",
    pendingReviews: "Pending reviews",
    noCreditsBody: "Automatic replies are paused. Top up your credits to resume automatic review handling.",
    topUp: "Top up credits",
    manualReply: "You can also reply manually from your dashboard.",
    weeklySubject: "Weekly summary",
    weeklyTitle: "Weekly summary",
    weeklyIntro: "Here is your account activity this week:",
    generatedReplies: "Generated replies",
    publishedGoogle: "Published on Google",
    pendingLine: (n: number) => `${n} review${n > 1 ? "s" : ""} awaiting a reply.`,
    dashboard: "View dashboard",
  },
};

const getProHeader = () => `
  <div style="background: ${STYLES.bgWhite}; padding: 32px 24px; border-bottom: 1px solid ${STYLES.borderLight};">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align: middle;"><img src="https://ranki.ai/favicon.png" width="32" height="32" alt="Ranki.ai" style="display: block;" /></td>
      <td style="vertical-align: middle; padding-left: 12px;"><span style="font-family: ${STYLES.fontFamily}; font-weight: 600; font-size: 18px; color: ${STYLES.textPrimary};">Ranki.ai</span></td>
    </tr></table>
  </div>`;

const getProFooter = (rights: string) => `
  <div style="padding: 24px; text-align: center; border-top: 1px solid ${STYLES.borderLight};">
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0 0 8px 0;">© 2025 Ranki.ai. ${rights}</p>
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0;"><a href="https://ranki.ai" style="color: ${STYLES.brandBlue}; text-decoration: none;">ranki.ai</a></p>
  </div>`;

const getProButton = (text: string, url: string) => `
  <a href="${url}" style="display: inline-block; background-color: ${STYLES.brandBlue}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-family: ${STYLES.fontFamily}; font-size: 14px; font-weight: 500;">${text}</a>`;

const shell = (lang: Lang, title: string, name: string, content: string) => {
  const t = T[lang];
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};"><div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">${getProHeader()}
<div style="padding: 40px 32px;"><h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">${title}</h1>
<p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${t.hello}${name ? ` ${name}` : ""},</p>${content}</div>${getProFooter(t.rights)}</div></body></html>`;
};

function renderTemplate(type: EmailType, lang: Lang, name: string, data?: EngagementEmailRequest["data"]): { subject: string; html: string } {
  const t = T[lang];
  const count = data?.pending_count || 0;
  const credits = data?.credits || 0;

  if (type === "activate_auto_reply") {
    return {
      subject: t.activateSubject,
      html: shell(lang, t.activateTitle, name, `
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${t.activateBody}</p>
        <div style="background: ${STYLES.bgLight}; border-radius: 6px; padding: 20px; margin: 24px 0; border-left: 3px solid ${STYLES.brandBlue};">
          <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 14px; font-weight: 500; margin: 0 0 12px 0;">${t.included}</p>
          <ul style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;"><li>${t.f1}</li><li>${t.f2}</li><li>${t.f3}</li><li>${t.f4}</li></ul>
        </div><div style="text-align: left; margin: 32px 0;">${getProButton(t.configure, "https://ranki.ai/ai-settings")}</div>`),
    };
  }

  if (type === "pending_reviews") {
    return {
      subject: t.pendingSubject(count),
      html: shell(lang, t.pendingTitle, name, `
        <div style="background: ${STYLES.warningBg}; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center;"><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.warningText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.unanswered}</p><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 600; margin: 0;">${count}</p></div>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${t.pendingBody}</p>
        <div style="text-align: left; margin: 32px 0;">${getProButton(t.viewReviews, "https://ranki.ai/reviews")}</div>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">${t.bulkTip}</p>`),
    };
  }

  if (type === "low_credits") {
    return {
      subject: t.lowSubject,
      html: shell(lang, t.lowTitle, name, `
        <div style="background: ${STYLES.errorBg}; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center;"><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.errorText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.remainingCredits}</p><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 600; margin: 0;">${credits}</p></div>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${t.lowBody}</p>
        <div style="text-align: left; margin: 32px 0;">${getProButton(t.seePlans, "https://ranki.ai/select-plan")}</div>`),
    };
  }

  if (type === "no_credits_upgrade") {
    return {
      subject: t.noCreditsSubject(count),
      html: shell(lang, t.noCreditsTitle, name, `
        <div style="background: ${STYLES.errorBg}; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center;"><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.errorText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.pendingReviews}</p><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 36px; font-weight: 600; margin: 0;">${count}</p></div>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${t.noCreditsBody}</p>
        <div style="text-align: left; margin: 32px 0;">${getProButton(t.topUp, "https://ranki.ai/select-plan")}</div>
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">${t.manualReply}</p>`),
    };
  }

  return {
    subject: t.weeklySubject,
    html: shell(lang, t.weeklyTitle, name, `
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">${t.weeklyIntro}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;"><tr><td style="width: 50%; padding: 0 8px 0 0;"><div style="background: ${STYLES.successBg}; border-radius: 6px; padding: 20px; text-align: center;"><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.successText}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.generatedReplies}</p><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 28px; font-weight: 600; margin: 0;">${data?.reviews_responded || 0}</p></div></td><td style="width: 50%; padding: 0 0 0 8px;"><div style="background: ${STYLES.bgLight}; border-radius: 6px; padding: 20px; text-align: center;"><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 13px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">${t.publishedGoogle}</p><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 28px; font-weight: 600; margin: 0;">${data?.reviews_published || 0}</p></div></td></tr></table>
      ${count > 0 ? `<div style="background: ${STYLES.warningBg}; border-radius: 6px; padding: 16px; margin: 24px 0;"><p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.warningText}; font-size: 14px; margin: 0;">${t.pendingLine(count)}</p></div>` : ""}
      <div style="text-align: left; margin: 32px 0;">${getProButton(t.dashboard, "https://ranki.ai/dashboard")}</div>`),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - skipping engagement email");
      return new Response(JSON.stringify({ success: false, message: "Email service not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: EngagementEmailRequest = await req.json();
    const { email, name, type, data } = body;
    if (!email || !type) return new Response(JSON.stringify({ error: "Missing email or type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const lang = await resolveEmailLang(email, body.lang, body.user_id);
    const firstName = name?.split(" ")[0] || "";
    const rendered = renderTemplate(type, lang, firstName, data);

    console.log(`Sending ${type} email to ${email} (lang=${lang})`);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Ranki.ai <support@ranki.ai>", to: [email], subject: rendered.subject, html: rendered.html }),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("Resend API error:", resData);
      return new Response(JSON.stringify({ success: false, error: resData }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Engagement email sent successfully:", resData?.id);
    return new Response(JSON.stringify({ success: true, id: resData?.id, language: lang }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Email error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
