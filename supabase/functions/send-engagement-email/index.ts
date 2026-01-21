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

// Brand colors
const BRAND_BLUE = "#2563eb";
const BRAND_YELLOW = "#facc15";
const BRAND_GREEN = "#22c55e";
const DARK_BG = "#1e293b";

const getHeader = () => `
  <div style="background-color: ${BRAND_BLUE}; padding: 30px; text-align: center;">
    <div style="display: inline-block; margin-bottom: 4px;">
      <span style="font-size: 32px; color: ${BRAND_YELLOW};">★</span>
    </div>
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Starlinko</h1>
  </div>
`;

const getFooter = () => `
  <div style="background-color: ${DARK_BG}; padding: 25px; text-align: center;">
    <span style="font-size: 20px; color: ${BRAND_YELLOW};">★</span>
    <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">
      Starlinko - <a href="https://starlinko.lovable.app" style="color: #60a5fa; text-decoration: none;">starlinko.lovable.app</a>
    </p>
  </div>
`;

const emailTemplates: Record<EmailType, (name: string, data?: EngagementEmailRequest["data"]) => { subject: string; html: string }> = {
  activate_auto_reply: (name) => ({
    subject: "⚡ Gagnez du temps : Activez les réponses automatiques",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    ${getHeader()}
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Saviez-vous que vous pouvez <strong>automatiser complètement</strong> vos réponses aux avis Google ?
      </p>
      
      <div style="background: #eff6ff; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid ${BRAND_BLUE};">
        <h3 style="color: ${BRAND_BLUE}; margin: 0 0 15px 0; font-size: 18px;">🤖 Réponses automatiques IA</h3>
        <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Répondez 24h/24, 7j/7 automatiquement</li>
          <li>Réponses personnalisées selon le ton de votre entreprise</li>
          <li>Publication directe sur Google (optionnel)</li>
          <li>Notifications pour chaque nouvel avis</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/ai-settings" 
           style="display: inline-block; background-color: ${BRAND_BLUE}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          ⚡ Activer maintenant
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Vous gardez le contrôle total - prévisualisez et modifiez avant publication !
      </p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `,
  }),

  pending_reviews: (name, data) => ({
    subject: `📝 ${data?.pending_count || 0} avis attendent votre réponse`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    ${getHeader()}
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">AVIS EN ATTENTE</p>
        <p style="margin: 0; color: #78350f; font-size: 48px; font-weight: 700;">${data?.pending_count || 0}</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">avis sans réponse</p>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Vos clients attendent une réponse ! Les entreprises qui répondent à leurs avis ont une 
        <strong>meilleure note moyenne</strong> et <strong>plus de visibilité</strong> sur Google.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/reviews" 
           style="display: inline-block; background-color: ${BRAND_BLUE}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          ✍️ Répondre aux avis
        </a>
      </div>
      
      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          💡 <strong>Astuce :</strong> Utilisez "Générer toutes les réponses" pour créer des réponses IA en un seul clic !
        </p>
      </div>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `,
  }),

  low_credits: (name, data) => ({
    subject: "⚠️ Plus que quelques crédits - Rechargez maintenant",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    ${getHeader()}
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border-left: 4px solid #ef4444;">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 600;">CRÉDITS RESTANTS</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 48px; font-weight: 700;">${data?.credits || 0}</p>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Vos crédits s'épuisent ! Pour continuer à générer des réponses IA professionnelles, 
        rechargez votre compte ou passez à un abonnement illimité.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/select-plan" 
           style="display: inline-block; background-color: ${BRAND_BLUE}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          💳 Voir les offres
        </a>
      </div>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `,
  }),

  no_credits_upgrade: (name, data) => ({
    subject: `🚨 ${data?.pending_count || 0} avis sans réponse - Rechargez vos crédits`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #dc2626; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Action requise</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border-left: 4px solid #dc2626;">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 600;">VOS CRÉDITS SONT ÉPUISÉS</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 48px; font-weight: 700;">${data?.pending_count || 0}</p>
        <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 14px;">avis ne reçoivent pas de réponse automatique</p>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        <strong>Vos clients attendent !</strong> Les réponses automatiques sont en pause car vos crédits sont épuisés. 
        Rechargez maintenant pour ne pas perdre l'engagement de vos clients.
      </p>
      
      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
          ⏰ <strong>Conseil :</strong> Répondre rapidement aux avis améliore votre référencement Google de 25% !
        </p>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/select-plan" 
           style="display: inline-block; background-color: ${BRAND_BLUE}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          ⚡ Recharger mes crédits
        </a>
      </div>
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
        Ou répondez manuellement depuis votre <a href="https://starlinko.lovable.app/reviews" style="color: ${BRAND_BLUE};">tableau de bord</a>
      </p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `,
  }),

  weekly_summary: (name, data) => ({
    subject: "📊 Votre résumé hebdomadaire Starlinko",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: ${BRAND_BLUE}; padding: 30px; text-align: center;">
      <div style="display: inline-block; margin-bottom: 4px;">
        <span style="font-size: 32px; color: ${BRAND_YELLOW};">★</span>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Starlinko</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Résumé de la semaine</p>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Voici votre activité de la semaine sur Starlinko :
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
        <tr>
          <td style="width: 50%; padding: 10px 5px 10px 0;">
            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid ${BRAND_GREEN};">
              <p style="margin: 0; color: #166534; font-size: 32px; font-weight: 700;">${data?.reviews_responded || 0}</p>
              <p style="margin: 5px 0 0 0; color: #15803d; font-size: 12px;">Réponses générées</p>
            </div>
          </td>
          <td style="width: 50%; padding: 10px 0 10px 5px;">
            <div style="background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; border-left: 4px solid ${BRAND_BLUE};">
              <p style="margin: 0; color: #1e40af; font-size: 32px; font-weight: 700;">${data?.reviews_published || 0}</p>
              <p style="margin: 5px 0 0 0; color: #1d4ed8; font-size: 12px;">Publiées sur Google</p>
            </div>
          </td>
        </tr>
      </table>
      
      ${(data?.pending_count || 0) > 0 ? `
      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          ⚠️ <strong>${data?.pending_count} avis</strong> attendent encore une réponse.
        </p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/dashboard" 
           style="display: inline-block; background-color: ${BRAND_BLUE}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          📊 Voir le tableau de bord
        </a>
      </div>
    </div>
    ${getFooter()}
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

    const firstName = name?.split(" ")[0] || "Cher client";
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
