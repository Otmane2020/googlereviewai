import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, BarChart3, MapPin, RefreshCw, AlertTriangle } from "lucide-react";

type Business = { id: string; name: string };
type Post = { id: string; status: string; scheduled_date: string; content_type: string; google_post_id?: string | null };
type Insights = { profileViews?: number; websiteClicks?: number; phoneCalls?: number; directionRequests?: number };

export default function Analytics() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const en = i18n.language?.toLowerCase().startsWith("en");
  const t = (fr: string, eng: string) => en ? eng : fr;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [days, setDays] = useState("30");
  const [posts, setPosts] = useState<Post[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightError, setInsightError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    supabase.from("businesses").select("id,name").eq("user_id", user.id).order("name").then(({ data, error }) => {
      if (!active) return;
      if (error) setLoadError(error.message);
      const list = (data || []) as Business[];
      setBusinesses(list);
      setBusinessId(old => list.some(b => b.id === old) ? old : (list[0]?.id || ""));
    });
    return () => { active = false; };
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!businessId || !user?.id) return;
    setLoading(true);
    setLoadError("");
    setInsightError("");
    setInsights(null);
    setPosts([]);
    const [contentResult, insightResult] = await Promise.all([
      supabase.from("scheduled_content").select("id,status,scheduled_date,content_type,google_post_id")
        .eq("user_id", user.id).eq("business_id", businessId)
        .order("scheduled_date", { ascending: false }).limit(1000),
      supabase.functions.invoke("get-gmb-insights", { body: { days: Number(days), business_id: businessId } }),
    ]);
    if (contentResult.error) setLoadError(contentResult.error.message);
    else setPosts((contentResult.data || []) as Post[]);
    if (insightResult.error) setInsightError(insightResult.error.message);
    else if (insightResult.data?.requires_reconnect) setInsightError(t("Reconnectez votre fiche Google pour consulter les statistiques.", "Reconnect your Google profile to see insights."));
    else if (insightResult.data?.error) setInsightError(String(insightResult.data.error));
    else if (insightResult.data?.insights) setInsights(insightResult.data.insights as Insights);
    else setInsightError(t("Statistiques indisponibles.", "Insights unavailable."));
    setLoading(false);
  }, [businessId, days, user?.id, en]);

  useEffect(() => { void refresh(); }, [refresh]);

  const total = posts.length;
  const published = posts.filter(p => p.status === "published" || (p.google_post_id && !["rejected", "failed", "error"].includes(p.status))).length;
  const ready = posts.filter(p => p.status === "generated" && !p.google_post_id).length;
  const failed = posts.filter(p => ["failed", "error", "rejected"].includes(p.status)).length;
  const processing = posts.filter(p => ["processing", "generating"].includes(p.status)).length;
  const countCards = [
    [t("Planifiés / créés", "Scheduled / created"), total],
    [t("Publiés / envoyés", "Published / submitted"), published],
    [t("Prêts", "Ready"), ready],
    [t("En cours", "In progress"), processing],
    [t("Échecs / refus", "Failed / rejected"), failed],
  ] as const;
  const insightCards = [
    [t("Vues de la fiche", "Profile views"), insights?.profileViews],
    [t("Clics vers le site", "Website clicks"), insights?.websiteClicks],
    [t("Appels", "Calls"), insights?.phoneCalls],
    [t("Itinéraires", "Directions"), insights?.directionRequests],
  ] as const;

  return <main className="space-y-5 px-3 py-5 md:p-6 max-w-6xl mx-auto">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold flex gap-2 items-center"><BarChart3 className="h-6 w-6 text-primary" /> Analytics</h1>
        <p className="text-sm text-muted-foreground">{t("Mesurer les actions SEO, GEO et la performance locale", "Measure SEO, GEO and local visibility performance")}</p></div>
      <Button variant="outline" onClick={() => void refresh()} disabled={loading || !businessId}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}/>{t("Actualiser", "Refresh")}</Button>
    </div>
    <div className="flex flex-wrap gap-3">
      <Select value={businessId} onValueChange={setBusinessId}><SelectTrigger className="w-64"><SelectValue placeholder={t("Choisir un établissement", "Choose a location")} /></SelectTrigger>
        <SelectContent>{businesses.map(b => <SelectItem value={b.id} key={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
      <Select value={days} onValueChange={setDays}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>
        {["7","30","90"].map(d => <SelectItem key={d} value={d}>{d} {t("jours", "days")}</SelectItem>)}
      </SelectContent></Select>
    </div>
    {loadError && <p role="alert" className="text-destructive text-sm">{loadError}</p>}
    {!businessId && <p className="text-muted-foreground">{t("Aucun établissement disponible.", "No location available.")}</p>}

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5"/>{t("Actions de publication", "Publishing activity")}</CardTitle>
      <CardDescription>{t("État des contenus planifiés. Ces volumes ne sont pas des indicateurs de classement.", "Scheduled-content status. These counts are not ranking indicators.")}</CardDescription></CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {countCards.map(([label,value]) => <div key={label} className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{loading ? "…" : value}</p></div>)}
      </CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5"/>{t("Performance Google Business", "Google Business performance")}</CardTitle>
      <CardDescription>{t("Mesures officielles du profil Google sur la période choisie.", "Google profile metrics for the selected period.")}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {insightError && <div className="text-sm text-muted-foreground flex gap-2 items-center"><AlertTriangle className="w-4 h-4"/> {insightError}</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{insightCards.map(([label,value]) => <div key={label} className="p-3 rounded-lg border"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{!loading && insights && typeof value === "number" ? value.toLocaleString(en ? "en-US" : "fr-FR") : "—"}</p></div>)}</div>
        <p className="text-xs text-muted-foreground">{t("Un tiret signifie donnée indisponible, pas zéro.", "A dash means unavailable data, not zero.")}</p>
      </CardContent></Card>

    <Card><CardHeader><CardTitle>{t("Mesure de visibilité", "Visibility measurement")}</CardTitle>
      <CardDescription>{t("SEO Google et citations IA : les résultats seront affichés ici après intégration de leurs sources de données, sans chiffres inventés.", "Google SEO and AI citations: results will appear here when their data sources are integrated, with no fabricated figures.")}</CardDescription></CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="outline">{t("Search Console non connecté", "Search Console not connected")}</Badge>
        <Badge variant="outline">{t("Citations IA non mesurées", "AI citations not measured")}</Badge>
      </CardContent>
    </Card>
    <p className="text-xs text-muted-foreground">{t("Les corrélations avant/après publication et les tendances 7/30/90 jours nécessitent des historiques de mesures. Aucun gain de positionnement n'est attribué automatiquement à une action.", "Before/after comparisons and 7/30/90-day trends require historical measurements. No ranking improvement is automatically attributed to an action.")}</p>
  </main>;
}
