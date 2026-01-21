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
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
        ⭐ Starlinko
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
      
      <!-- Credits Box -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">CADEAU DE BIENVENUE</p>
        <p style="margin: 0; color: #78350f; font-size: 36px; font-weight: 700;">10 crédits gratuits</p>
        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">pour générer vos premières réponses IA</p>
      </div>
      
      <!-- Features -->
      <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">
        Ce que vous pouvez faire maintenant :
      </h3>
      
      <div style="margin: 0 0 25px 0;">
        <div style="display: flex; align-items: center; margin: 12px 0;">
          <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 12px;">✓</span>
          <span style="color: #374151; font-size: 15px;"><strong>Connecter Google My Business</strong> - Synchronisez tous vos avis</span>
        </div>
        <div style="display: flex; align-items: center; margin: 12px 0;">
          <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 12px;">✓</span>
          <span style="color: #374151; font-size: 15px;"><strong>Générer des réponses IA</strong> - Personnalisées et professionnelles</span>
        </div>
        <div style="display: flex; align-items: center; margin: 12px 0;">
          <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 12px;">✓</span>
          <span style="color: #374151; font-size: 15px;"><strong>Publier en 1 clic</strong> - Directement sur Google</span>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://starlinko.lovable.app/dashboard" 
           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          🚀 Commencer maintenant
        </a>
      </div>
      
      <!-- Tips -->
      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; color: #6366f1; font-size: 14px; font-weight: 600;">💡 CONSEIL PRO</p>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          Activez les <strong>réponses automatiques</strong> dans les paramètres IA pour ne plus jamais manquer un avis. 
          Starlinko répondra automatiquement à vos nouveaux avis 24h/24 !
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 30px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
        Des questions ? Répondez simplement à cet email.
      </p>
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        Starlinko - Gérez vos avis Google en automatique<br>
        <a href="https://starlinko.lovable.app" style="color: #8b5cf6; text-decoration: none;">starlinko.lovable.app</a>
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
        from: "Starlinko <onboarding@resend.dev>",
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
