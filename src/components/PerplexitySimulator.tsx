import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";

type Result={question:string;answer:string;citations:string[];mentioned:boolean;cited:boolean;model:string;measured_at:string;disclaimer:string;provider:string};
export function PerplexitySimulator({businessId,businessName}:{businessId:string;businessName:string}) {
 const {i18n}=useTranslation();const en=i18n.language?.startsWith("en");const t=(fr:string,eng:string)=>en?eng:fr;
 const [question,setQuestion]=useState(""),[loading,setLoading]=useState(false),[result,setResult]=useState<Result|null>(null),[error,setError]=useState("");
 useEffect(()=>{setQuestion("");setResult(null);setError("");},[businessId]);
 const run=async()=>{
  if(!businessId||question.trim().length<12)return;
  setLoading(true);setError("");setResult(null);
  try{
   const {data,error:e}=await supabase.functions.invoke("simulate-perplexity",{body:{business_id:businessId,question:question.trim()}});
   if(e||data?.error)throw new Error(data?.message||data?.error||e?.message||"Simulation failed");
   if(!data?.answer)throw new Error("No answer");
   setResult(data as Result);
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setLoading(false);}
 };
 return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5"/>{t("Simulation des réponses Perplexity","Perplexity answer simulation")}</CardTitle>
 <CardDescription>{t("Posez une question naturelle sans mentionner votre marque. L'API Perplexity recherche une réponse publique ; nous détectons si l'établissement apparaît dans la réponse et si son site est cité.","Ask a natural question without including your brand. The Perplexity API answers using public sources; we check brand mentions and website citations.")}</CardDescription></CardHeader>
 <CardContent className="space-y-4">
 <div className="flex flex-wrap gap-2">{[t("Quels sont les meilleurs professionnels près de chez moi ?","What are the best local providers near me?"),t("Où trouver ce service dans ma ville ?","Where can I find this service in my city?")].map(q=><Button key={q} variant="outline" size="sm" onClick={()=>setQuestion(q)}>{q}</Button>)}</div>
 <Input value={question} maxLength={400} onChange={e=>setQuestion(e.target.value)} placeholder={t("Ex. Où acheter un canapé à Lognes ?","E.g. Where can I buy a sofa in Lognes?")}/>
 <Button onClick={()=>void run()} disabled={!businessId||loading||question.trim().length<12}>{loading&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{t("Interroger Perplexity","Query Perplexity")}</Button>
 <p className="text-xs text-muted-foreground">{t("Chaque interrogation utilise l'API Perplexity et peut entraîner des frais. Aucune simulation fictive n'est affichée.","Each query calls the Perplexity API and may incur usage costs. No fabricated simulation results are displayed.")}</p>
 {error&&<p role="alert" className="text-sm text-destructive">{error==="PERPLEXITY_NOT_CONFIGURED"?t("Clé PERPLEXITY_API_KEY non configurée dans Lovable Cloud.","PERPLEXITY_API_KEY is not configured in Lovable Cloud."):error}</p>}
 {result&&<section className="space-y-3 border-t pt-4">
  <div className="flex flex-wrap items-center gap-2"><Badge variant={result.mentioned?"default":"secondary"}>{result.mentioned?t("Marque mentionnée","Brand mentioned"):t("Marque non mentionnée","Brand not mentioned")}</Badge><Badge variant={result.cited?"default":"outline"}>{result.cited?t("Site cité","Website cited"):t("Site non cité","Website not cited")}</Badge></div>
  <p className="text-xs text-muted-foreground">{result.provider} · {result.model} · {new Date(result.measured_at).toLocaleString(en?"en-US":"fr-FR")} · {businessName}</p>
  <p className="text-sm whitespace-pre-wrap break-words">{result.answer}</p>
  <div className="space-y-1"><strong className="text-sm">{t("Sources de la réponse","Answer citations")} ({result.citations.length})</strong>
   {result.citations.length?result.citations.map((url,i)=><a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary break-all hover:underline"><ExternalLink className="h-3 w-3 shrink-0"/>{url}</a>):<p className="text-xs text-muted-foreground">{t("Aucune source retournée par l'API.","No citations returned by the API.")}</p>}
  </div>
  <p className="text-xs text-muted-foreground">{t("Une seule réponse API n'est ni un classement permanent ni une preuve de visibilité dans l'interface publique Perplexity.","A single API response is not a stable ranking or proof of visibility in the public Perplexity interface.")}</p>
 </section>}
 </CardContent></Card>;
}
