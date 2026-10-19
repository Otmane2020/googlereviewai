import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, FlaskConical, RefreshCw } from "lucide-react";

type Business = {
  id: string; name: string; description: string | null; address: string | null;
  website: string | null; website_content: string | null; auto_keywords: string[] | null;
  gmb_language: string | null;
};
type CheckResult = { status: "ok" | "warning" | "error"; message: string; details?: unknown };
const truncate = (value: unknown) => JSON.stringify(value, null, 2)?.slice(0, 8000) || "";
export default function SeoEngineTest() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const en = i18n.language.toLowerCase().startsWith("en");
  const t = (fr: string, eng: string) => en ? eng : fr;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [id, setId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [error, setError] = useState("");
  const business = businesses.find(b => b.id === id);

  useEffect(() => {
    if (!user?.id) return;
    let live = true;
    supabase.from("businesses")
      .select("id,name,description,address,website,website_content,auto_keywords,gmb_language")
      .eq("user_id", user.id).order("name").then(({ data, error: e }) => {
        if (!live) return;
        if (e) setError(e.message);
        const rows = (data || []) as Business[];
        setBusinesses(rows);
        setId(old => rows.some(x => x.id === old) ? old : (rows[0]?.id || ""));
      });
    return () => { live = false; };
  }, [user?.id]);

  useEffect(() => {
    setResults({});
    setKeyword(business?.auto_keywords?.[0] || "");
  }, [id]);

  const record = (key: string, result: CheckResult) => setResults(old => ({ ...old, [key]: result }));
  const run = async (key: string, fn: () => Promise<CheckResult>) => {
    if (!business || running) return;
    setRunning(key);
    try { record(key, await fn()); }
    catch (e) { record(key, { status: "error", message: e instanceof Error ? e.message : String(e) }); }
    finally { setRunning(null); }
  };
  const context = () => ({
    businessName: business?.name,
    businessDescription: business?.description || business?.name,
    gmbDescription: business?.description,
    location: business?.address || "",
    websiteUrl: business?.website || undefined,
    websiteContent: business?.website_content || undefined,
    language: business?.gmb_language || "fr",
  });

  const checkSources = () => run("sources", async () => ({
    status: business?.website && !business?.website_content ? "warning" : (business?.description || business?.website_content || business?.auto_keywords?.length ? "ok" : "warning"),
    message: t("Données enregistrées pour cet établissement (aucune requête payante)", "Stored data for this location (no paid request)"),
    details: { name: business?.name, website: business?.website, description: business?.description,
      crawledCharacters: business?.website_content?.length || 0, keywords: business?.auto_keywords || [],
      note: !business?.website ? t("Mode sans site : Google Business", "No-site mode: Google Business") : undefined },
  }));

  const checkCrawl = () => run("crawl", async () => {
    const { data, error: err } = await supabase.functions.invoke("analyze-business-website", {
      body: { businessId: business!.id, generateContent: false },
    });
    if (err || data?.success === false) throw new Error(data?.error || err?.message || "Analysis failed");
    setBusinesses(prev => prev.map(b => b.id === business!.id ? { ...b,
      auto_keywords: data?.keywords || b.auto_keywords,
      website_content: b.website_content,
    } : b));
    return { status: data?.keyword_metrics_status === "measured" && data?.keywords?.length && (data?.websiteAnalyzed || !business?.website) ? "ok" : "warning",
      message: t("Analyse exécutée. La mesure DataForSEO est indiquée séparément.", "Analysis executed. DataForSEO status is shown separately."),
      details: { websiteAnalyzed: data?.websiteAnalyzed, gmbAnalyzed: data?.gmbAnalyzed,
        keywords: data?.keywords, keyword_metrics_status: data?.keyword_metrics_status || "function_not_deployed_or_old_version",
        crawl_status: data?.crawl_status || (data?.websiteAnalyzed ? "success" : "unavailable"),
        crawl_error: data?.crawl_error || null,
        crawl_metadata: data?.crawl_metadata || null,
        ai_status: data?.ai_status || (data?.keywords?.length ? "success" : "unavailable"),
        keyword_metrics: data?.keyword_metrics, keyword_opportunities: data?.keyword_opportunities,
        qualified_keywords_count: data?.qualified_keywords_count,
        measured_keyword_count: (data?.keyword_metrics || []).filter((item: { volume: number | null }) => item.volume !== null).length,
        note: t("Cette action actualise les mots-clés enregistrés.", "This updates saved business keywords.") } };
  });

  const checkGeneration = () => run("generation", async () => {
    // Refuse a misleading green result for a known cross-brand context.
    if (business?.description && /\bsweet\s+deco\b/i.test(business.description) &&
        !/\bsweet\s+deco\b/i.test(business.name)) {
      return { status: "error", message: t(
        "Génération bloquée : la description contient Sweet Deco alors que cet établissement porte un autre nom. Corrigez les données dans Établissements.",
        "Generation blocked: the description mentions Sweet Deco but this is a different business. Correct its data in Locations."
      ) };
    }
    const { data, error: err } = await supabase.functions.invoke("generate-seo-content", {
      body: { ...context(), type: "seo_article", title: keyword.trim() || (en ? "Our services" : "Nos services"),
        keywords: keyword.trim() ? [keyword.trim()] : (business?.auto_keywords || []).slice(0, 3) },
    });
    if (err || data?.error) throw new Error(data?.message || data?.error || err?.message || "Generation failed");
    const article = data?.article;
    if (!article || typeof article.content !== "string" || article.content.trim().length < 80)
      throw new Error(t("Réponse article invalide", "Invalid article response"));
    const brandMismatch = Boolean(business?.name && business?.description && !business.description.toLowerCase().includes(business.name.toLowerCase()) && /sweet deco/i.test(business.description) && !/sweet deco/i.test(business.name));
    return { status: article.content.length <= 1500 && !brandMismatch ? "ok" : "warning",
      message: t("Article généré en aperçu, non enregistré et non publié", "Article generated as preview, not saved or published"),
      details: { title: article.title, characters: article.content.length, brandMismatch: Boolean(brandMismatch), content: article.content } };
  });

  return <main className="max-w-5xl mx-auto p-4 md:p-7 space-y-5">
    <div><h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="h-6 w-6"/> {t("Test du moteur SEO / GEO", "SEO / GEO engine test")}</h1>
      <p className="text-sm text-muted-foreground">{t("Diagnostic par établissement. Aucun contenu n'est publié sur Google.", "Location-specific diagnostics. Nothing is published to Google.")}</p></div>
    <Card><CardHeader><CardTitle>{t("Établissement", "Location")}</CardTitle><CardDescription>{t("Les données proviennent de l'onglet Établissements.", "Data comes from the Locations tab.")}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}
        <select aria-label={t("Établissement", "Location")} className="w-full rounded-md border bg-background p-2" value={id} onChange={e => setId(e.target.value)}>
          {businesses.map(b => <option value={b.id} key={b.id}>{b.name}</option>)}
        </select>
        <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={t("Mot-clé pour le test de génération", "Keyword for generation test")} />
        <p className="text-xs text-muted-foreground">{t("L'analyse du site et les mesures DataForSEO peuvent consommer des crédits API. La génération utilise le fournisseur IA configuré.", "Website analysis and DataForSEO measurements may incur API charges. Generation uses the configured AI provider.")}</p>
      </CardContent></Card>
    {([
      ["sources", t("1. Vérifier les données Google / site", "1. Check Google / website data"), checkSources],
      ["crawl", t("2. Tester l'autocrawl + DataForSEO", "2. Test autocrawl + DataForSEO"), checkCrawl],
      ["generation", t("3. Tester la génération sans publication", "3. Test generation without publishing"), checkGeneration],
    ] as const).map(([key, title, action]) => <Card key={key}><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3"><Button variant="outline" disabled={!business || Boolean(running)} onClick={action}>
        {running === key ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>}{t("Exécuter le test", "Run test")}
      </Button>
      {results[key] && <div className="space-y-2">
        <Badge variant={results[key].status === "ok" ? "default" : results[key].status === "error" ? "destructive" : "secondary"}>{results[key].status.toUpperCase()}</Badge>
        <p className="text-sm">{results[key].message}</p>
        {results[key].details !== undefined && <pre className="text-xs whitespace-pre-wrap break-words overflow-auto rounded-md bg-muted p-3">{truncate(results[key].details)}</pre>}
      </div>}
      </CardContent></Card>)}
  </main>;
}
