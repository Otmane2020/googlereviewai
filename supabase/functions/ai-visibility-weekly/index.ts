import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Business = {
 id:string; user_id:string; name:string; address:string|null; categories:string[]|null;
 auto_keywords:string[]|null; website:string|null;
};
type Setting = {business_id:string;user_id:string;updated_at:string};
const headers = { "Content-Type":"application/json" };
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const clean=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const domainOf=(raw:string|null):string=>{
 try{return new URL(/^https?:\/\//i.test(raw||"")?raw!:"https://"+raw).hostname.toLowerCase().replace(/^www\./,"");}catch{return "";}
};
const cityOf=(address:string|null):string=>{
 if(!address)return "";
 const postal=address.match(/\b\d{5}\s+([^,]{2,55})/);
 if(postal)return postal[1].trim();
 const parts=address.split(",").map(p=>p.trim()).filter(Boolean);
 return parts.length>1 ? parts[parts.length-2].replace(/\b\d{5}\b/g,"").trim().slice(0,60) : "";
};
const chooseQuestion=(b:Business):string=>{
 const keywords=(b.auto_keywords||[]).filter(k=>k.length>4 && !clean(k).includes(clean(b.name))).slice(0,6);
 const service=keywords.find(k=>k.split(/\s+/).length>=2) || b.categories?.[0] || "professionnels";
 const city=cityOf(b.address);
 return city ? `Quels sont les meilleurs ${service} à ${city} ?` : `Quels sont les meilleurs ${service} et où les trouver ?`;
};
const weekStart=():string=>{
 const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);
};
const checkBrand=(answer:string,b:Business,citations:string[])=>{
 const name=clean(b.name),full=clean(answer);
 const domain=domainOf(b.website);
 const mentioned=Boolean(name.length>2 && full.includes(name));
 const cited=Boolean(domain&&citations.some(link=>{
  try{const host=new URL(link).hostname.toLowerCase().replace(/^www\./,"");return host===domain||host.endsWith("."+domain);}catch{return false;}
 }));
 return {mentioned,cited};
};
async function perform(admin:any,key:string,b:Business,setting:Setting,week:string){
 const question=chooseQuestion(b);
 // Reserve a weekly slot before contacting the paid API. A retry cannot double-bill.
 const {data:reservation,error:reservationError}=await admin.from("reviewai_ai_visibility_checks")
  .insert({business_id:b.id,user_id:b.user_id,run_week:week,question,status:"pending"})
  .select("id").maybeSingle();
 if(reservationError){
  if(reservationError.code==="23505")return "skipped";
  console.error("AI visibility reservation failed",reservationError.code);return "failed";
 }
 if(!reservation?.id)return "skipped";
 try{
  const response=await fetch("https://api.perplexity.ai/chat/completions",{
   method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
   body:JSON.stringify({
    model:"sonar",temperature:0.1,max_tokens:600,
    messages:[
     {role:"system",content:"Réponds à la question de façon impartiale à partir de sources web accessibles. Cite les sources quand elles sont disponibles. Ne suppose pas qu'une marque précise doit être recommandée."},
     {role:"user",content:question}
    ],
   }),signal:AbortSignal.timeout(35000),
  });
  if(!response.ok)throw Error("PERPLEXITY_HTTP_"+response.status);
  const data=await response.json();
  const answer=String(data?.choices?.[0]?.message?.content||"").slice(0,10000);
  if(answer.trim().length<15)throw Error("PERPLEXITY_EMPTY_ANSWER");
  const raw=Array.isArray(data.citations)?data.citations:(Array.isArray(data.search_results)?data.search_results.map((s:any)=>s.url):[]);
  const citations=raw.filter((u:unknown):u is string=>typeof u==="string"&&/^https?:\/\//i.test(u)).slice(0,20);
  const detected=checkBrand(answer,b,citations);
  const {error}=await admin.from("reviewai_ai_visibility_checks").update({
    answer,citations,mentioned:detected.mentioned,cited:detected.cited,status:"success",error_code:null,
  }).eq("id",reservation.id);
  if(error)throw Error("DATABASE_SAVE_FAILED");
  return "success";
 }catch(error){
  const code=error instanceof Error?error.message:"PROBE_FAILED";
  console.error("AI visibility probe failed",code);
  await admin.from("reviewai_ai_visibility_checks").update({status:"failed",error_code:code.slice(0,120)}).eq("id",reservation.id);
  return "failed";
 }
}
Deno.serve(async req=>{
 if(req.method!=="POST")return respond({error:"METHOD_NOT_ALLOWED"},405);
 const expected=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const supplied=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 if(!expected||supplied!==expected)return respond({error:"FORBIDDEN"},403);
 const perplexity=Deno.env.get("PERPLEXITY_API_KEY");
 if(!perplexity)return respond({error:"PERPLEXITY_NOT_CONFIGURED"},503);
 const admin=createClient(Deno.env.get("SUPABASE_URL")!,expected);
 const {data:settings,error}=await admin.from("reviewai_ai_visibility_settings")
  .select("business_id,user_id,updated_at").eq("enabled",true).order("updated_at",{ascending:true}).limit(100);
 if(error)return respond({error:"SETTINGS_UNAVAILABLE"},500);
 let success=0,failed=0,skipped=0;
 const week=weekStart();
 const capPerUser=2;
 const usage=new Map<string,number>();
 for(const setting of (settings||[]) as Setting[]){
  // Bound the scheduled workload globally to control credit consumption.
  if(success+failed>=20)break;
  let used=usage.get(setting.user_id);
  if(used===undefined){
   const {count,error:countError}=await admin.from("reviewai_ai_visibility_checks")
    .select("id",{count:"exact",head:true}).eq("user_id",setting.user_id)
    .gte("checked_at",new Date(Date.now()-7*86400000).toISOString());
   if(countError){skipped++;continue;}used=count||0;
  }
  if(used>=capPerUser){usage.set(setting.user_id,used);skipped++;continue;}
  const {data:b}=await admin.from("businesses").select("id,user_id,name,address,categories,auto_keywords,website")
   .eq("id",setting.business_id).eq("user_id",setting.user_id).maybeSingle();
  if(!b){skipped++;continue;}
  const result=await perform(admin,perplexity,b as Business,setting,week);
  if(result==="success")success++;else if(result==="failed")failed++;else skipped++;
  if(result!=="skipped"){
   used++;
   await admin.from("reviewai_ai_visibility_settings").update({updated_at:new Date().toISOString()}).eq("business_id",setting.business_id);
  }
  usage.set(setting.user_id,used);
 }
 return respond({ok:true,success,failed,skipped,weekly_cap_per_account:capPerUser});
});
