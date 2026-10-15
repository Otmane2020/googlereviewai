import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateGmbImage } from "../_shared/gmbImages.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const session = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const body = await req.json().catch(() => ({})) as {
      business_id?: string;
      summary?: string;
      editorial_mode?: "news" | "information" | "spotlight";
    };
    if (!body.business_id || !body.summary?.trim() || body.summary.length > 1500) {
      return new Response(JSON.stringify({ error: "Business and post content (max 1500 characters) are required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(url, service);
    const { data: business } = await admin.from("businesses")
      .select("id,name,address,description,categories,website")
      .eq("id", body.business_id).eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (!business) return new Response(JSON.stringify({ error: "Business not found." }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const mode = (["news","information","spotlight"].includes(body.editorial_mode || "")
      ? body.editorial_mode : "information") as "news" | "information" | "spotlight";
    const imageUrl = await generateGmbImage(admin, user.id, business, body.summary, mode);
    return new Response(JSON.stringify({ success: true, image_url: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to generate image";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
