import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = "activate_auto_reply" | "pending_reviews" | "low_credits" | "weekly_summary";

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

const emailTemplates: Record<EmailType, (name: string, data?: EngagementEmailRequest["data"]) => { subject: string; html: string }> = {
  activate_auto_reply: (name) => ({
    subject: "⚡ Gagnez du temps : Activez les réponses automatiques",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⭐ Starlinko</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Saviez-vous que vous pouvez <strong>automatiser complètement</strong> vos réponses aux avis Google ?
      </p>
      
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">🤖 Réponses automatiques IA</h3>
        <ul style="color: #3730a3; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Répondez 24h/24, 7j/7 automatiquement</li>
          <li>Réponses personnalisées selon le ton de votre entreprise</li>
          <li>Publication directe sur Google (optionnel)</li>
          <li>Notifications pour chaque nouvel avis</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/ai-settings" 
           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          ⚡ Activer maintenant
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Vous gardez le contrôle total - prévisualisez et modifiez avant publication !
      </p>
    </div>
    <div style="background-color: #1f2937; padding: 25px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        Starlinko - <a href="https://starlinko.lovable.app" style="color: #8b5cf6;">starlinko.lovable.app</a>
      </p>
    </div>
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
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⭐ Starlinko</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
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
           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          ✍️ Répondre aux avis
        </a>
      </div>
      
      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          💡 <strong>Astuce :</strong> Utilisez "Générer toutes les réponses" pour créer des réponses IA en un seul clic !
        </p>
      </div>
    </div>
    <div style="background-color: #1f2937; padding: 25px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        Starlinko - <a href="https://starlinko.lovable.app" style="color: #8b5cf6;">starlinko.lovable.app</a>
      </p>
    </div>
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
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⭐ Starlinko</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 600;">CRÉDITS RESTANTS</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 48px; font-weight: 700;">${data?.credits || 0}</p>
      </div>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Vos crédits s'épuisent ! Pour continuer à générer des réponses IA professionnelles, 
        rechargez votre compte ou passez à un abonnement illimité.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/select-plan" 
           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          💳 Voir les offres
        </a>
      </div>
    </div>
    <div style="background-color: #1f2937; padding: 25px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        Starlinko - <a href="https://starlinko.lovable.app" style="color: #8b5cf6;">starlinko.lovable.app</a>
      </p>
    </div>
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
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⭐ Starlinko</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Résumé de la semaine</p>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${name} 👋</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Voici votre activité de la semaine sur Starlinko :
      </p>
      
      <div style="display: flex; gap: 15px; margin: 25px 0;">
        <div style="flex: 1; background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #166534; font-size: 32px; font-weight: 700;">${data?.reviews_responded || 0}</p>
          <p style="margin: 5px 0 0 0; color: #15803d; font-size: 12px;">Réponses générées</p>
        </div>
        <div style="flex: 1; background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #1e40af; font-size: 32px; font-weight: 700;">${data?.reviews_published || 0}</p>
          <p style="margin: 5px 0 0 0; color: #1d4ed8; font-size: 12px;">Publiées sur Google</p>
        </div>
      </div>
      
      ${(data?.pending_count || 0) > 0 ? `
      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          ⚠️ <strong>${data?.pending_count} avis</strong> attendent encore une réponse.
        </p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/dashboard" 
           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          📊 Voir le tableau de bord
        </a>
      </div>
    </div>
    <div style="background-color: #1f2937; padding: 25px; text-align: center;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        Starlinko - <a href="https://starlinko.lovable.app" style="color: #8b5cf6;">starlinko.lovable.app</a>
      </p>
    </div>
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

    const resend = new Resend(RESEND_API_KEY);
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

    const { data: emailData, error } = await resend.emails.send({
      from: "Starlinko <notifications@starlinko.com>",
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ success: false, error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Engagement email sent successfully:", emailData?.id);

    return new Response(
      JSON.stringify({ success: true, id: emailData?.id }),
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
