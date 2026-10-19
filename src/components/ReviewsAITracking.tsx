import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Site = { id:string; public_key:string; domain:string; last_seen_at:string|null };
type Event = { session_id:string; source_type:string; source_name:string; event_type:string; created_at:string };
const domainFrom = (url:string) => { try { return new URL(/^https?:\/\//.test(url)?url:"https://"+url).hostname.toLowerCase().replace(/^www\./,""); } catch { return ""; } };

export function ReviewsAITracking({businessId,website,userId,days}:{businessId:string;website:string|null;userId:string;days:number}) {
 const {i18n}=useTranslation(), en=i18n.language?.startsWith("en");
 const tr=(fr:string,english:string)=>en?english:fr;
 const [site,setSite]=useState<Site|null>(null),[events,setEvents]=useState<Event[]>([]);
 const [error,setError]=useState(""),[loading,setLoading]=useState(false);
 const [creating,setCreating]=useState(false);
 const domain=domainFrom(website||"");
 const fetchData=useCallback(async()=>{
  if(!businessId||!userId)return;
  setLoading(true);setError("");setEvents([]);
  const {data,error:err}=await supabase.from("reviewai_tracking_sites" as any).select("id,public_key,domain,last_seen_at").eq("business_id",businessId).eq("user_id",userId).maybeSingle();
  if(err){setError(err.message);setSite(null);setLoading(false);return;}
  const row=(data||null) as Site|null;setSite(row);
  if(row){
   const {data:ev,error:e}=await supabase.from("reviewai_tracking_events" as any).select("session_id,source_type,source_name,event_type,created_at").eq("site_id",row.id).gte("created_at",new Date(Date.now()-days*86400000).toISOString()).order("created_at",{ascending:false}).limit(3000);
   if(e)setError(e.message);else setEvents((ev||[]) as unknown as Event[]);
  }setLoading(false);
 },[businessId,userId,days]);
 useEffect(()=>{void fetchData();},[fetchData]);
 const create=async()=>{
  if(!domain||!userId||!businessId)return;setCreating(true);setError("");
  const {error:e}=await supabase.from("reviewai_tracking_sites" as any).insert({user_id:userId,business_id:businessId,domain});
  if(e)setError(e.message);else await fetchData();setCreating(false);
 };
 const endpoint=`${(import.meta.env.VITE_SUPABASE_URL||"").replace(/\/$/,"")}/functions/v1/reviewai-track`;
 const snippet=site&&endpoint.startsWith("https://")?`<script async src="https://reviewsai.store/reviewsai-tracker.js" data-site="${site.public_key}" data-endpoint="${endpoint}"></script>`:"";
 const ai=events.filter(x=>x.source_type==="ai");
 const sessions=new Set(events.map(x=>x.session_id)).size;
 const aiSessions=new Set(ai.map(x=>x.session_id)).size;
 const bySource=Object.entries(ai.reduce<Record<string,Set<string>>>((a,x)=>{(a[x.source_name] ||= new Set()).add(x.session_id);return a;},{})).map(([name,set])=>({name,count:set.size})).sort((a,b)=>b.count-a.count);
 return <Card><CardHeader><CardTitle>{tr("Balise ReviewsAI Store — trafic IA","ReviewsAI Store tag — AI traffic")}</CardTitle>
 <CardDescription>{tr("Mesure les visiteurs venant d'assistants IA sur le site de cet établissement. Les citations sans clic ne peuvent pas être mesurées par une balise.","Measures visitors referred by AI assistants to this business website. Mentions without clicks cannot be measured by a tag.")}</CardDescription></CardHeader>
 <CardContent className="space-y-4">
 {!domain?<p className="text-sm text-muted-foreground">{tr("Cet établissement n'a pas de site web : aucune balise à installer. Le suivi des mentions IA nécessite une méthode distincte.","No website is configured. There is no tag to install; AI mentions require separate monitoring.")}</p>:
 <>
 <p className="text-sm">{tr("Domaine","Domain")}: <strong>{site?.domain||domain}</strong></p>
 {!site?<Button disabled={creating} onClick={create}>{tr("Générer ma balise","Generate my tag")}</Button>:<>
 <div className="flex items-center gap-2 flex-wrap"><Badge variant="outline">{site.last_seen_at?tr("Balise détectée","Tag detected"):tr("En attente d'installation","Awaiting installation")}</Badge><Button variant="outline" size="sm" onClick={()=>void fetchData()} disabled={loading}>{tr("Actualiser","Refresh")}</Button></div>
 {snippet?<><p className="text-sm">{tr("Collez cette balise avant la fermeture de la balise head sur le site de l'établissement.","Paste this tag before the closing head tag on the business website.")}</p>
 <pre className="overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs">{snippet}</pre>
 <Button variant="outline" onClick={()=>navigator.clipboard.writeText(snippet)}>{tr("Copier la balise","Copy tag")}</Button></>:<p className="text-sm text-destructive">{tr("URL Supabase manquante dans la configuration publique.","Supabase URL missing from public configuration.")}</p>}
 <div className="grid grid-cols-2 gap-3"><div className="border rounded-lg p-3"><p className="text-xs text-muted-foreground">{tr("Sessions du site","Site sessions")}</p><strong className="text-xl">{sessions}</strong></div><div className="border rounded-lg p-3"><p className="text-xs text-muted-foreground">{tr("Sessions depuis une IA","AI referred sessions")}</p><strong className="text-xl">{aiSessions}</strong></div></div>
 {bySource.length>0?<div className="space-y-1">{bySource.map(row=><p key={row.name} className="text-sm flex justify-between"><span>{row.name}</span><strong>{row.count}</strong></p>)}</div>:<p className="text-xs text-muted-foreground">{tr("Aucune visite provenant d'un assistant IA n'a encore été enregistrée pour cette période.","No visits referred by an AI assistant recorded for this period.")}</p>}
 </>}
 </>}
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 <p className="text-xs text-muted-foreground">{tr("Sources identifiées par le référent ou les UTM. Les données peuvent être incomplètes si l'assistant masque le référent, si le consentement n'est pas accordé, ou si des bloqueurs interviennent.","Sources identified by referrer or UTM. Data can be incomplete when assistants suppress referrers, consent is absent, or blockers interfere.")}</p>
 </CardContent></Card>;
}
