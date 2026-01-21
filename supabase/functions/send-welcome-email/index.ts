import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

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

    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = name?.split(" ")[0] || "Cher client";

    console.log(`Sending welcome email to ${email}`);

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with brand colors -->
    <div style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
      <div style="display: inline-block; margin-bottom: 8px;">
        <!-- Star logo representation -->
        <span style="font-size: 42px; color: #facc15;">★</span>
        <span style="display: inline-block; width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; margin-left: -12px; margin-bottom: 24px;"></span>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
        Starlinko
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
        Gérez vos avis Google automatiquement
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
        Bienvenue ${firstName} ! 🎉
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Merci de rejoindre Starlinko ! Vous avez fait le premier pas vers une gestion simplifiée de votre réputation en ligne.
      </p>
      
      <!-- Credits Box with brand yellow -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border-left: 4px solid #facc15;">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">CADEAU DE BIENVENUE</p>
        <p style="margin: 0; color: #78350f; font-size: 36px; font-weight: 700;">10 crédits gratuits</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">pour générer vos premières réponses IA</p>
      </div>
      
      <!-- Features -->
      <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">
        Ce que vous pouvez faire maintenant :
      </h3>
      
      <div style="margin: 0 0 25px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 32px;">
              <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-size: 14px;">✓</span>
            </td>
            <td style="padding: 12px 0; padding-left: 12px; color: #374151; font-size: 15px;">
              <strong>Connecter Google My Business</strong> - Synchronisez tous vos avis
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 32px;">
              <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-size: 14px;">✓</span>
            </td>
            <td style="padding: 12px 0; padding-left: 12px; color: #374151; font-size: 15px;">
              <strong>Générer des réponses IA</strong> - Personnalisées et professionnelles
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; vertical-align: top; width: 32px;">
              <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-size: 14px;">✓</span>
            </td>
            <td style="padding: 12px 0; padding-left: 12px; color: #374151; font-size: 15px;">
              <strong>Publier en 1 clic</strong> - Directement sur Google
            </td>
          </tr>
        </table>
      </div>
      
      <!-- CTA Button with brand blue -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/dashboard" 
           style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          🚀 Commencer maintenant
        </a>
      </div>
      
      <!-- Tips -->
      <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0 0 10px 0; color: #2563eb; font-size: 14px; font-weight: 600;">💡 CONSEIL PRO</p>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          Activez les <strong>réponses automatiques</strong> dans les paramètres IA pour ne plus jamais manquer un avis. 
          Starlinko répondra automatiquement à vos nouveaux avis 24h/24 !
        </p>
      </div>
    </div>
    
    <!-- Footer with dark background -->
    <div style="background-color: #1e293b; padding: 30px; text-align: center;">
      <div style="margin-bottom: 15px;">
        <span style="font-size: 24px; color: #facc15;">★</span>
      </div>
      <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
        Des questions ? Répondez simplement à cet email.
      </p>
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        Starlinko - Gérez vos avis Google en automatique<br>
        <a href="https://starlinko.lovable.app" style="color: #60a5fa; text-decoration: none;">starlinko.lovable.app</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Starlinko <support@starlinko.app>",
        to: [email],
        subject: "🎉 Bienvenue sur Starlinko - Vos 10 crédits gratuits vous attendent !",
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
