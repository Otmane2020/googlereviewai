import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const clean=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return reply({error:"METHOD_NOT_ALLOWED"},405);
 try{
  const bearer=req.headers.get("Authorization")||"";
  const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:bearer}}});
  const {data:{user}}=await client.auth.getUser();
  if(!user)return reply({error:"AUTH_REQUIRED"},401);
  const {business_id,question}=await req.json();
  if(typeof business_id!=="string"||typeof question!=="string"||question.trim().length<12||question.length>400)return reply({error:"INVALID_INPUT"},400);
  const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:business}=await admin.from("businesses").select("id,name,website,address,description").eq("id",business_id).eq("user_id",user.id).maybeSingle();
  if(!business)return reply({error:"BUSINESS_NOT_FOUND"},404);
  const key=Deno.env.get("PERPLEXITY_API_KEY");
  if(!key)return reply({error:"PERPLEXITY_NOT_CONFIGURED",message:"Configure PERPLEXITY_API_KEY in Lovable Cloud secrets."},503);
  // The prompt deliberately omits business identity, so the result is not biased by feeding the brand.
  const response=await fetch("https://api.perplexity.ai/chat/completions",{
   method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
   body:JSON.stringify({model:"sonar",messages:[{role:"system",content:"Answer the user question using publicly available web sources. Include relevant citations; do not assume a specific business is the answer."},{role:"user",content:question.trim()}],max_tokens:850,temperature:0.1}),
   signal:AbortSignal.timeout(40000),
  });
  if(!response.ok){console.error("Perplexity API",response.status);return reply({error:"PERPLEXITY_API_ERROR",upstream_status:response.status},502);}
  const data=await response.json();
  const answer=String(data?.choices?.[0]?.message?.content||"").slice(0,12000);
  if(!answer)return reply({error:"EMPTY_RESPONSE"},502);
  const name=clean(business.name);
  let domain="";
  try{domain=new URL(/^https?:\/\//.test(business.website||"")?business.website:"https://"+business.website).hostname.replace(/^www\./,"").toLowerCase();}catch{}
  const sources=Array.isArray(data.citations)?data.citations: Array.isArray(data.search_results)?data.search_results.map((s:any)=>s.url):[];
  const citations=sources.filter((x:unknown):x is string=>typeof x==="string"&&/^https?:\/\//.test(x)).slice(0,25);
  const mentioned=Boolean(name&&clean(answer).includes(name));
  const cited=Boolean(domain&&citations.some(url=>{try{const h=new URL(url).hostname.replace(/^www\./,"");return h===domain||h.endsWith("."+domain);}catch{return false;}}));
  return reply({provider:"Perplexity Sonar API",question:question.trim(),answer,citations,mentioned,cited,domain:domain||null,model:data.model||"sonar",measured_at:new Date().toISOString(),disclaimer:"One API response, not a stable ranking or observation of consumer Perplexity UI."});
 }catch(e){console.error("Perplexity simulation error",e);return reply({error:"SIMULATION_FAILED"},500);}
});
