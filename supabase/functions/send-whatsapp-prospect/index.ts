import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  to: string;              // numéro du prospect (format international)
  business_name: string;
  review_count?: number;
  template?: boolean;      // true = template approuvé Meta, false = message libre (si la conversation est ouverte)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WA_PHONE_ID = Deno.env.get("META_WA_PHONE_NUMBER_ID");     // ID du numéro WhatsApp Business
    const WA_TOKEN = Deno.env.get("META_WA_ACCESS_TOKEN");            // Token Meta permanent
    const WA_TEMPLATE = Deno.env.get("META_WA_TEMPLATE_NAME") || "starlinko_prospection"; // Nom du template approuvé

    if (!WA_PHONE_ID || !WA_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp Meta API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, business_name, review_count, template = true }: WhatsAppRequest = await req.json();

    if (!to || !business_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, business_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format E.164 sans le +
    const formattedTo = to.replace(/[^0-9]/g, "").replace(/^0/, "33");

    let messagePayload: any;

    if (template) {
      // ✅ Template approuvé Meta (obligatoire pour initier une conversation)
      // Crée le template "starlinko_prospection" dans Meta Business Manager
      messagePayload = {
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "template",
        template: {
          name: WA_TEMPLATE,
          language: { code: "fr" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: business_name },
                { type: "text", text: String(review_count || "plusieurs") },
              ],
            },
            {
              // Bouton CTA vers le site
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: "essai-gratuit" }],
            },
          ],
        },
      };
    } else {
      // Message libre (seulement si le prospect a déjà initié la conversation)
      messagePayload = {
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "text",
        text: {
          preview_url: true,
          body: `Bonjour *${business_name}* 👋\n\nVous avez ${review_count || "des"} avis Google sans réponse.\n\n*Starlinko* répond automatiquement à vos avis avec l'IA :\n✅ 2 minutes de setup\n✅ Zéro effort ensuite\n✅ 14 jours gratuits\n\n👉 https://starlinko.app\n\nRépondez *STOP* pour ne plus être contacté.`,
        },
      };
    }

    // Appel API Meta WhatsApp Cloud
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp Meta API error:", result);
      return new Response(
        JSON.stringify({ success: false, error: result.error?.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log dans Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("prospection_logs").insert({
      channel: "whatsapp",
      to: `+${formattedTo}`,
      business_name,
      status: "sent",
      twilio_sid: result.messages?.[0]?.id,  // On réutilise la colonne twilio_sid pour l'ID Meta
      sent_at: new Date().toISOString(),
    });

    // Mise à jour du statut prospect
    await supabase
      .from("prospects")
      .update({ contact_status: "sms_sent", updated_at: new Date().toISOString() })
      .eq("business_name", business_name);

    console.log(`WhatsApp sent to +${formattedTo} for ${business_name} — ID: ${result.messages?.[0]?.id}`);

    return new Response(
      JSON.stringify({ success: true, message_id: result.messages?.[0]?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
