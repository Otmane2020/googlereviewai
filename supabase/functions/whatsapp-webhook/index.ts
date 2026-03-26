import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // ✅ Vérification du webhook Meta (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("META_WA_VERIFY_TOKEN");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WhatsApp webhook verified ✅");
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // 📩 Réception des messages entrants (POST)
  if (req.method === "POST") {
    try {
      const body = await req.json();

      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages) {
        return new Response("OK", { status: 200 });
      }

      const message = value.messages[0];
      const from = message.from;  // numéro du prospect
      const text = message.text?.body?.toLowerCase() || "";
      const messageId = message.id;

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Récupérer le prospect
      const { data: prospect } = await supabase
        .from("prospects")
        .select("*")
        .eq("phone", `+${from}`)
        .single();

      // Gestion STOP
      if (text.includes("stop")) {
        await supabase
          .from("prospects")
          .update({ contact_status: "ignored", updated_at: new Date().toISOString() })
          .eq("phone", `+${from}`);

        // Répondre au STOP
        await sendWhatsAppReply(from, "Vous avez été retiré de notre liste. Bonne journée ! 👋", Deno.env.get("META_WA_PHONE_NUMBER_ID")!, Deno.env.get("META_WA_ACCESS_TOKEN")!);
        return new Response("OK", { status: 200 });
      }

      // Gestion réponse positive (oui, intéressé, etc.)
      if (text.includes("oui") || text.includes("intéressé") || text.includes("interesse") || text.includes("lien") || text.includes("essai")) {
        await supabase
          .from("prospects")
          .update({ contact_status: "responded", updated_at: new Date().toISOString() })
          .eq("phone", `+${from}`);

        await sendWhatsAppReply(
          from,
          `Super ! 🎉 Voici votre lien pour démarrer votre essai gratuit de 14 jours :\n\n👉 https://starlinko.app\n\nCreez votre compte en 2 minutes, connectez votre Google Business et l'IA répond à vos avis automatiquement.\n\nJe reste disponible si vous avez des questions !`,
          Deno.env.get("META_WA_PHONE_NUMBER_ID")!,
          Deno.env.get("META_WA_ACCESS_TOKEN")!
        );

        // Notifier par email que le prospect a répondu positivement
        await supabase.functions.invoke("send-email-notification", {
          body: {
            to: "otmane@starlinko.app",
            subject: `🔥 Prospect intéressé : ${prospect?.business_name || from}`,
            html: `<h2>Un prospect a répondu positivement !</h2><p><b>Numéro :</b> +${from}</p><p><b>Business :</b> ${prospect?.business_name || "Inconnu"}</p><p><b>Message :</b> ${message.text?.body}</p>`,
          },
        });
      }

      // Logger la réponse
      await supabase.from("prospection_logs").insert({
        channel: "whatsapp",
        to: `+${from}`,
        business_name: prospect?.business_name || "Inconnu",
        status: "reply_received",
        sent_at: new Date().toISOString(),
      });

      return new Response("OK", { status: 200 });

    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("OK", { status: 200 }); // Toujours 200 pour Meta
    }
  }

  return new Response(null, { headers: corsHeaders });
});

// Fonction helper pour envoyer un message WhatsApp
async function sendWhatsAppReply(to: string, text: string, phoneId: string, token: string) {
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}
