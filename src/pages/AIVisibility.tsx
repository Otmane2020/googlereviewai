import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ReviewsAITracking } from "@/components/ReviewsAITracking";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Sparkles, RefreshCw, Eye, Link2, Search, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
type Business = {id:string;name:string;website:string|null;address:string|null;categories:string[]|null};
type Setting = {business_id:string;enabled:boolean};
type Check = {id:string;question:string;answer:string|null;citations:string[]|null;mentioned:boolean|null;cited:boolean|null;status:"pending"|"success"|"failed";error_code:string|null;checked_at:string};
export default function AIVisibility(){
 const {user}=useAuth(),{i18n}=useTranslation();
 const en=i18n.language?.toLowerCase().startsWith("en");
 const t=(fr:string,english:string)=>en?english:fr;
 const [businesses,setBusinesses]=useState<Business[]>([]);
 const [id,setId]=useState("");
 const [days,setDays]=useState("30");
 const [checks,setChecks]=useState<Check[]>([]);
 const [enabled,setEnabled]=useState(false);
 const [hasSetting,setHasSetting]=useState(false);
 const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const selected=businesses.find(b=>b.id===id);
 useEffect(()=>{
  if(!user?.id)return;
  let active=true;
  supabase.from("businesses").select("id,name,website,address,categories").eq("user_id",user.id).order("name").then(({data,error:e})=>{
   if(!active)return;
   if(e)setError(e.message);
   const items=(data||[]) as Business[];setBusinesses(items);
   setId(old=>items.some(b=>b.id===old)?old:(items[0]?.id||""));
  });
  return ()=>{active=false;};
 },[user?.id]);
 const load=useCallback(async()=>{
  if(!user?.id||!id)return;
  setLoading(true);setError("");setChecks([]);
  const [settings,observations]=await Promise.all([
   supabase.from("reviewai_ai_visibility_settings" as any).select("business_id,enabled").eq("business_id",id).eq("user_id",user.id).maybeSingle(),
   supabase.from("reviewai_ai_visibility_checks" as any).select("id,question,answer,citations,mentioned,cited,status,error_code,checked_at")
    .eq("business_id",id).eq("user_id",user.id)
    .gte("checked_at",new Date(Date.now()-Number(days)*86400000).toISOString())
    .order("checked_at",{ascending:false}).limit(100),
  ]);
  if(settings.error)setError(settings.error.message);
  else{setHasSetting(Boolean(settings.data));setEnabled(Boolean((settings.data as Setting|null)?.enabled));}
  if(observations.error)setError(observations.error.message);
  else setChecks((observations.data||[]) as Check[]);
  setLoading(false);
 },[id,user?.id,days]);
 useEffect(()=>{void load();},[load]);
 const toggle=async()=>{
  if(!user?.id||!id||saving)return;
  setSaving(true);setError("");
  const newEnabled=!enabled;
  const change={business_id:id,user_id:user.id,enabled:newEnabled,updated_at:new Date().toISOString()};
  const q=supabase.from("reviewai_ai_visibility_settings" as any);
  const {error:e}=hasSetting
   ?await q.update({enabled:newEnabled,updated_at:change.updated_at}).eq("business_id",id).eq("user_id",user.id)
   :await q.insert(change);
  if(e)setError(e.message);else{setEnabled(newEnabled);setHasSetting(true);}
  setSaving(false);
 };
 const observed=checks.filter(x=>x.status==="success");
 const citedCount=observed.filter(x=>x.cited===true).length;
 const mentionCount=observed.filter(x=>x.mentioned===true).length;
 const failures=checks.filter(x=>x.status==="failed").length;
 const pct=observed.length?Math.round(mentionCount/observed.length*100):null;
 const pctCited=observed.length?Math.round(citedCount/observed.length*100):null;
 const latest=observed[0];
 const trend=useMemo(()=>{
  const grouped=new Map<string,{period:string;checks:number;mentions:number;citations:number}>();
  for(const item of observed){
   const dt=new Date(item.checked_at);dt.setUTCHours(0,0,0,0);
   dt.setUTCDate(dt.getUTCDate()-(dt.getUTCDay()+6)%7);
   const week=dt.toISOString().slice(0,10);
   const row=grouped.get(week)||{period:week,checks:0,mentions:0,citations:0};
   row.checks++;
   if(item.mentioned)row.mentions++;
   if(item.cited)row.citations++;
   grouped.set(week,row);
  }
  return [...grouped.values()].sort((a,b)=>a.period.localeCompare(b.period));
 },[checks]);
 const date=(iso:string)=>new Date(iso).toLocaleString(en?"en-US":"fr-FR",{dateStyle:"medium",timeStyle:"short"});
 const nextMonday=useMemo(()=>{
  const now=new Date(),d=new Date(now);
  d.setUTCHours(8,0,0,0);d.setUTCDate(d.getUTCDate()+((8-d.getUTCDay())%7));
  if(d.getTime()<=now.getTime())d.setUTCDate(d.getUTCDate()+7);
  return date(d.toISOString());
 },[en]);
 const kpis=[
  {label:t("Mentions de marque","Brand mentions"),value:pct===null?"—":pct+" %",note:t("Sur les réponses réellement mesurées","Of observed API answers"),icon:Eye,accent:"bg-violet-500/10 text-violet-700 dark:text-violet-300"},
  {label:t("Site cité","Website citations"),value:pctCited===null?"—":pctCited+" %",note:t("Citations de votre domaine","Citations of your domain"),icon:Link2,accent:"bg-sky-500/10 text-sky-700 dark:text-sky-300"},
  {label:t("Réponses analysées","Answers analyzed"),value:String(observed.length),note:t("Perplexity Sonar · tests réels","Perplexity Sonar · real checks"),icon:Search,accent:"bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"},
  {label:t("Dernière mesure","Last check"),value:latest?new Date(latest.checked_at).toLocaleDateString(en?"en-US":"fr-FR"):"—",note:failures?t(`${failures} test(s) échoué(s)`,`${failures} failed check(s)`):t("Historique enregistré","Recorded history"),icon:Clock3,accent:"bg-amber-500/10 text-amber-700 dark:text-amber-300"},
 ];
 return <main className="max-w-6xl mx-auto space-y-6 px-3 py-5 md:p-7">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="space-y-1"><div className="flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary"/><h1 className="text-2xl font-bold">{t("Visibilité dans les IA","AI search visibility")}</h1></div>
    <p className="text-sm text-muted-foreground">{t("Vérifications autonomes des réponses IA et trafic provenant des assistants.","Autonomous answer checks and AI-referred website traffic.")}</p></div>
   <Button variant="outline" disabled={loading||!id} onClick={()=>void load()}><RefreshCw className={`h-4 w-4 mr-2 ${loading?"animate-spin":""}`}/>{t("Actualiser","Refresh")}</Button>
  </div>
  <div className="flex flex-wrap gap-3">
   <Select value={id} onValueChange={setId}><SelectTrigger className="w-64"><SelectValue placeholder={t("Choisir un établissement","Choose a location")}/></SelectTrigger>
    <SelectContent>{businesses.map(b=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
   <Select value={days} onValueChange={setDays}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent>
    {["7","30","90"].map(v=><SelectItem key={v} value={v}>{v} {t("jours","days")}</SelectItem>)}
   </SelectContent></Select>
  </div>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  {id&&<Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-background to-sky-500/5">
   <CardHeader><div className="flex flex-wrap items-center justify-between gap-3">
    <div><CardTitle className="flex gap-2 items-center"><ShieldCheck className="h-5 w-5"/>{t("Suivi automatique des réponses","Automatic answer monitoring")}</CardTitle>
     <CardDescription className="mt-1">{t("Le système crée lui-même une question de recherche à partir des catégories et de la localisation, puis interroge Perplexity sans citer votre marque.","The system generates a category-and-location-based question and queries Perplexity without suggesting your brand.")}</CardDescription></div>
    <Badge variant={enabled?"default":"secondary"}>{enabled?t("Activé","Enabled"):t("Désactivé","Disabled")}</Badge>
   </div></CardHeader>
   <CardContent className="flex flex-wrap justify-between items-center gap-3">
    <div className="text-xs text-muted-foreground space-y-1">
     <p>{t("Fréquence : chaque lundi vers 8 h UTC · 1 contrôle par établissement et par semaine.","Schedule: Mondays around 08:00 UTC · one check per business per week.")}</p>
     <p>{t("Sécurité budget : 2 contrôles maximum par compte sur 7 jours, sans répétition automatique en cas d'échec.","Budget protection: at most 2 checks per account per 7 days, without automatic paid retries.")}</p>
     <p>{t("Prochain créneau","Next run")}: {nextMonday}</p>
    </div>
    <Button variant={enabled?"outline":"default"} disabled={saving||loading} onClick={()=>void toggle()}>{saving?"…":enabled?t("Désactiver le suivi","Disable monitoring"):t("Activer le suivi hebdomadaire","Enable weekly monitoring")}</Button>
   </CardContent>
  </Card>}
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
   {kpis.map(item=><div key={item.label} className="rounded-2xl border bg-card p-4 shadow-sm">
    <div className={`inline-flex p-2 rounded-xl mb-3 ${item.accent}`}><item.icon className="h-4 w-4"/></div>
    <p className="text-xs text-muted-foreground">{item.label}</p>
    <p className="text-2xl font-bold mt-1">{loading?"…":item.value}</p><p className="text-[11px] text-muted-foreground mt-1">{item.note}</p>
   </div>)}
  </div>
  {observed.length>0&&<Card className="border-sky-500/15"><CardHeader>
   <CardTitle>{t("Tendance des mentions et citations","Brand mentions and citations over time")}</CardTitle>
   <CardDescription>{t("Nombre de réponses mesurées, mentions de marque et citations du site par semaine. Un graphique vide n'est pas un score nul.","Weekly observed answers, brand mentions and website citations. Missing observations are not zero visibility.")}</CardDescription>
   </CardHeader><CardContent><div className="h-60 w-full"><ResponsiveContainer width="100%" height="100%">
    <BarChart data={trend} margin={{top:8,right:8,left:-20,bottom:0}}>
     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.16}/>
     <XAxis dataKey="period" tick={{fontSize:11}}/><YAxis allowDecimals={false} tick={{fontSize:11}}/>
     <Tooltip/>
     <Bar dataKey="checks" name={t("Réponses","Answers")} fill="#64748b" radius={[3,3,0,0]}/>
     <Bar dataKey="mentions" name={t("Mentions","Mentions")} fill="#8b5cf6" radius={[3,3,0,0]}/>
     <Bar dataKey="citations" name={t("Citations","Citations")} fill="#0ea5e9" radius={[3,3,0,0]}/>
    </BarChart>
   </ResponsiveContainer></div></CardContent></Card>}
  {id&&<Card><CardHeader><CardTitle>{t("Historique des réponses et citations","Answer and citation history")}</CardTitle>
   <CardDescription>{t("Observations réelles de l'API Perplexity ; elles ne garantissent pas le classement dans l'application grand public.","Real Perplexity API observations; not guaranteed rankings in its consumer app.")}</CardDescription></CardHeader>
   <CardContent className="space-y-4">
    {!loading&&!checks.length&&<div className="rounded-xl border border-dashed px-4 py-7 text-center text-sm text-muted-foreground">{enabled?t("Suivi activé. Les résultats s'afficheront après le prochain contrôle planifié.","Monitoring is enabled. Results appear after the next scheduled check."):t("Aucune mesure pour la période. Activez le suivi hebdomadaire pour commencer.","No observations for this period. Enable weekly monitoring to begin.")}</div>}
    {checks.map(c=><div key={c.id} className="rounded-xl border p-4 space-y-3">
     <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{date(c.checked_at)} · Perplexity Sonar</span>
      <div className="flex gap-2">{c.status==="success"?<>
       <Badge variant={c.mentioned?"default":"secondary"}>{c.mentioned?t("Marque citée","Brand mentioned"):t("Non mentionnée","Not mentioned")}</Badge>
       <Badge variant={c.cited?"default":"outline"}>{c.cited?t("Site source","Website source"):t("Site non cité","Website not cited")}</Badge>
      </>:<Badge variant="secondary">{c.status==="failed"?t("Échec","Failed"):t("En attente","Pending")}</Badge>}</div>
     </div>
     <p className="font-medium text-sm">{c.question}</p>
     {c.status==="success"&&<><p className="text-sm whitespace-pre-wrap break-words text-foreground/90">{c.answer}</p>
      {Array.isArray(c.citations)&&c.citations.length>0&&<div className="space-y-1"><p className="text-xs font-semibold">{t("Sources vérifiables","Verifiable sources")}</p>
       {c.citations.map((url,i)=><a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 break-all text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3 mt-0.5 shrink-0"/>{url}</a>)}
      </div>}
     </>}
     {c.status==="failed"&&<p className="text-xs text-destructive">{c.error_code||t("Réponse indisponible","No response")}</p>}
    </div>)}
   </CardContent>
  </Card>}
  {id&&user?.id&&<ReviewsAITracking businessId={id} website={selected?.website||null} userId={user.id} days={Number(days)}/>}
  <p className="text-xs text-muted-foreground">{t("Les mentions IA sans clic sont mesurées par les contrôles Perplexity. Les visites via assistants sont mesurées séparément par la balise ReviewsAI Store. Aucune valeur n'est estimée si les données manquent.","Brand visibility is measured by Perplexity checks; website traffic from AI assistants is measured separately by the ReviewsAI Store tag. Missing data is never estimated.")}</p>
 </main>;
}
