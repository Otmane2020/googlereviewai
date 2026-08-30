import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Webhook de statut d'appel
  if (action === "status") {
    const body = await req.formData();
    const callSid = body.get("CallSid");
    const callStatus = body.get("CallStatus");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase
      .from("prospection_logs")
      .update({ status: callStatus?.toString(), updated_at: new Date().toISOString() })
      .eq("twilio_sid", callSid?.toString());

    return new Response("OK", { status: 200 });
  }

  // Gestion des touches (Appuyez sur 1)
  const digit = url.searchParams.get("Digits") || (await req.formData().then(f => f.get("Digits")).catch(() => null));

  const businessName = url.searchParams.get("business") || "votre établissement";
  const reviewCount = url.searchParams.get("reviews") || "plusieurs";

  // Si le prospect a appuyé sur 1 → envoyer SMS avec lien
  if (digit === "1") {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-FR" voice="Polly.Lea">
    Parfait ! Nous vous envoyons un SMS avec le lien pour commencer votre essai gratuit de 14 jours.
    À très bientôt !
  </Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Message vocal principal
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-FR" voice="Polly.Lea">
    Bonjour ! Je vous contacte au sujet de ${businessName}.
  </Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="Polly.Lea">
    Vous avez ${reviewCount} avis Google. Répondre à chacun prend du temps précieux.
  </Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="Polly.Lea">
    Starlinko répond automatiquement à vos avis Google avec l'intelligence artificielle.
    Zéro effort. 2 minutes pour démarrer. 14 jours gratuits.
  </Say>
  <Pause length="1"/>
  <Gather numDigits="1" action="${req.url}&amp;Digits=" method="GET" timeout="10">
    <Say language="fr-FR" voice="Polly.Lea">
      Appuyez sur 1 pour recevoir le lien par SMS. Ou raccrochez pour ignorer ce message.
    </Say>
  </Gather>
  <Say language="fr-FR" voice="Polly.Lea">
    Pas de problème. Vous pouvez nous retrouver sur starlinko point app. Bonne journée !
  </Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
});
