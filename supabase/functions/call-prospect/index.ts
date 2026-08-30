import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CallRequest {
  to: string;           // numéro du prospect
  business_name: string;
  review_count?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ success: false, message: "Twilio not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, business_name, review_count }: CallRequest = await req.json();

    if (!to || !business_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, business_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedTo = to.startsWith("+") ? to : `+33${to.replace(/^0/, "")}`;

    // URL du webhook TwiML qui génère le message vocal
    const webhookUrl = `${SUPABASE_URL}/functions/v1/twilio-voice-webhook?business=${encodeURIComponent(business_name)}&reviews=${review_count || 0}`;

    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: formattedTo,
          Url: webhookUrl,
          Method: "GET",
          StatusCallback: `${SUPABASE_URL}/functions/v1/twilio-voice-webhook?action=status`,
          StatusCallbackMethod: "POST",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio Call error:", result);
      return new Response(
        JSON.stringify({ success: false, error: result.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log dans Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("prospection_logs").insert({
      channel: "call",
      to: formattedTo,
      business_name,
      status: "initiated",
      twilio_sid: result.sid,
      sent_at: new Date().toISOString(),
    });

    console.log(`Call initiated to ${formattedTo} for ${business_name} — SID: ${result.sid}`);

    return new Response(
      JSON.stringify({ success: true, sid: result.sid, status: result.status }),
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
