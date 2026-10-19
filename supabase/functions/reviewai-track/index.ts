import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST,OPTIONS" };
const validHost = (value: string) => { try { return new URL(value).hostname.toLowerCase().replace(/^www\./,""); } catch { return ""; } };
const source = (ref: string, utm: string) => {
  const host = (utm || ref).toLowerCase();
  const ai = [
    ["ChatGPT", /chatgpt|chat\.openai|openai\.com/],
    ["Perplexity", /perplexity\.ai/],
    ["Gemini", /gemini\.google/],
    ["Claude", /claude\.ai/],
    ["Copilot", /copilot\.microsoft|bing\.com\/chat/],
    ["Grok", /grok\.com|x\.ai/],
    ["DeepSeek", /chat\.deepseek|deepseek\.com/],
    ["Mistral", /chat\.mistral|mistral\.ai/],
    ["You.com", /you\.com/],
  ] as const;
  for (const [name, re] of ai) if (re.test(host)) return { type: "ai", name };
  return { type: ref ? "referral" : "direct", name: ref || "direct" };
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null,{headers:cors});
  if (req.method !== "POST") return new Response("Method not allowed",{status:405,headers:cors});
  try {
    if (Number(req.headers.get("content-length") || 0) > 4096) return new Response("Too large",{status:413,headers:cors});
    const body = await req.json();
    const key = String(body?.site || "");
    const session = String(body?.session_id || "");
    const path = String(body?.path || "").slice(0,512);
    if (!/^rv_[a-f0-9]{32}$/.test(key) || !/^[a-zA-Z0-9_-]{8,100}$/.test(session) || !path.startsWith("/"))
      return new Response("Invalid event",{status:400,headers:cors});
    const admin = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: site } = await admin.from("reviewai_tracking_sites").select("id,domain").eq("public_key",key).maybeSingle();
    if (!site) return new Response("Not found",{status:404,headers:cors});
    const origin = validHost(req.headers.get("origin") || "");
    const expected = String(site.domain).toLowerCase().replace(/^www\./,"");
    if (!origin || (origin !== expected && !origin.endsWith("." + expected)))
      return new Response("Origin mismatch",{status:403,headers:cors});
    const ref = String(body.referrer_host || "").slice(0,160).toLowerCase();
    const utm = String(body.utm_source || "").slice(0,80).toLowerCase();
    const attrib = source(ref,utm);
    const { error } = await admin.from("reviewai_tracking_events").insert({
      site_id:site.id, session_id:session, page_path:path, event_type:body.event_type === "conversion" ? "conversion" : "page_view",
      event_name:typeof body.event_name === "string" ? body.event_name.slice(0,80) : null,
      referrer_host:ref || null,source_type:attrib.type,source_name:attrib.name,
    });
    if (error) throw error;
    await admin.from("reviewai_tracking_sites").update({last_seen_at:new Date().toISOString()}).eq("id",site.id);
    return new Response(JSON.stringify({ok:true}),{headers:{...cors,"Content-Type":"application/json"}});
  } catch(err){console.error("[reviewai-track]",err);return new Response("Event rejected",{status:500,headers:cors});}
});
