import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { includesPremiumModules, isCurrentModuleSubscription } from "@/lib/planEntitlements";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { ManageLocationsDialog } from "@/components/ManageLocationsDialog";
import { ArticlePreviewDialog } from "@/components/ArticlePreviewDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Loader2, Calendar, Check, Clock, AlertCircle, RefreshCw, Building2, Send, Lock, Eye, List, ChevronDown, CheckCircle, Settings } from "lucide-react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { BrandSparkle } from "@/components/BrandSparkle";


interface Business {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  website: string | null;
  categories: string[] | null;
  auto_keywords: string[] | null;
  google_place_id?: string | null;
  gmb_language?: string | null;
}

interface ScheduledContent {
  id: string;
  business_id: string;
  content_type: string;
  scheduled_date: string;
  status: string;
  title: string | null;
  content: string | null;
  question: string | null;
  answer: string | null;
  keyword_used: string | null;
}

const SEOAutoPost = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.toLowerCase().startsWith("en");
  const t = (fr: string, en: string) => (isEN ? en : fr);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [rewritingExisting, setRewritingExisting] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState("planning");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ScheduledContent | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [publicationHour, setPublicationHour] = useState(7);
  const [seoUpgradeOpen, setSeoUpgradeOpen] = useState(false);
  const [manageBusinessesOpen, setManageBusinessesOpen] = useState(false);

  // Use subscription verification hook
  const { loading: subscriptionLoading } = useRequireSubscription();

  useEffect(() => {
    if (subscriptionLoading || !user) return;
    fetchData();
    checkSubscription();
  }, [subscriptionLoading, user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    // Check if user has SEO AutoPost subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("module", "seo_autopost")
      .eq("status", "active")
      .maybeSingle();
    
    // Also check if user has a paid plan (Pro or Business)
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_name,plan_id,subscription_status,current_period_end,trial_end")
      .eq("id", user.id)
      .single();
    
    // A plan name without an active billing status is not a premium entitlement.
    // Old module rows marked active but past current_period_end are not valid.
    setIsSubscribed(includesPremiumModules(profile) ||
      (subscription ? isCurrentModuleSubscription(subscription) : false));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch businesses and AI settings in parallel
      const [businessRes, aiSettingsRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, address, description, website, categories, auto_keywords, google_place_id, gmb_language")
          .eq("user_id", user!.id)
          .eq("is_active", true),
        supabase
          .from("ai_settings")
          .select("publication_hour")
          .eq("user_id", user!.id)
          .maybeSingle()
      ]);
      
      setBusinesses((businessRes.data as Business[]) || []);
      
      // Set publication hour from settings
      if (aiSettingsRes.data && (aiSettingsRes.data as any).publication_hour !== undefined) {
        setPublicationHour((aiSettingsRes.data as any).publication_hour);
      }
      
      if (businessRes.data && businessRes.data.length > 0) {
        const nextBusiness = businessRes.data.find((b) => b.id === selectedBusiness?.id) || businessRes.data[0];
        setSelectedBusiness(nextBusiness as Business);
        await fetchScheduledContent(nextBusiness.id);
      } else {
        setSelectedBusiness(null);
        setScheduledContent([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchScheduledContent = async (businessId: string) => {
    const { data } = await supabase
      .from("scheduled_content")
      .select("*")
      .eq("business_id", businessId)
      .eq("user_id", user!.id)
      .eq("content_type", "seo_article")
      .order("scheduled_date", { ascending: true });
    
    setScheduledContent((data as ScheduledContent[]) || []);
  };

  const manageLocations = () => setManageBusinessesOpen(true);

  const handlePreviewArticle = (article: ScheduledContent) => {
    setSelectedArticle(article);
    setShowPreviewDialog(true);
  };

  // Auto-launch plan generation once per location when the plan allows it and no content exists yet.
  const autoLaunchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (loading || generating || !isSubscribed || !selectedBusiness) return;
    if (scheduledContent.length > 0 || autoLaunchedRef.current.has(selectedBusiness.id)) return;
    autoLaunchedRef.current.add(selectedBusiness.id);
    analyzeAndGeneratePlan();
  }, [loading, generating, isSubscribed, selectedBusiness?.id, scheduledContent.length]);

  const analyzeAndGeneratePlan = async () => {
    if (!selectedBusiness) return;
    
    if (!isSubscribed) {
      toast({ title: t("Abonnement requis", "Subscription required"), description: t("Le SEO automatique nécessite Pro ou Business.", "SEO automation requires Pro or Business."), variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      // Generate keywords from business info using AI
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "analyze_business",
          websiteUrl: selectedBusiness.website || undefined,
          gmbDescription: selectedBusiness.description || undefined,
          businessName: selectedBusiness.name,
          businessDescription: selectedBusiness.description || selectedBusiness.name,
          location: selectedBusiness.address || "",
          language: selectedBusiness.gmb_language || "fr",
        },
      });

      if (analysisError || analysisData?.error) throw new Error(analysisData?.message || analysisError?.message || "SEO analysis failed");

      const keywords: string[] = Array.isArray(analysisData?.keywords)
        ? analysisData.keywords.filter((x: unknown): x is string => typeof x === "string" && x.trim().length > 0)
        : [];
      if (!keywords.length) throw new Error(t("L'analyse IA n'a retourné aucun mot-clé. Réessayez.", "AI returned no keywords. Please retry."));

      // Update business with auto-detected keywords
      await supabase
        .from("businesses")
        .update({ 
          auto_keywords: keywords,
          description: analysisData?.description || selectedBusiness.description 
        })
        .eq("id", selectedBusiness.id);

      // Generate 30 article titles
      const { data: titlesData, error: titlesError } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "article_titles",
          websiteUrl: selectedBusiness.website || undefined,
          gmbDescription: selectedBusiness.description || undefined,
          businessName: selectedBusiness.name,
          businessDescription: analysisData?.description || selectedBusiness.description || selectedBusiness.name,
          location: selectedBusiness.address || "",
          language: selectedBusiness.gmb_language || "fr",
          keywords: keywords,
          count: 30,
        },
      });

      if (titlesError || titlesData?.error) throw new Error(titlesData?.message || titlesError?.message || "SEO titles generation failed");
      const titles: string[] = Array.isArray(titlesData?.titles) ? titlesData.titles : [];
      if (!titles.length) throw new Error(t("Aucun titre SEO généré. Réessayez.", "No SEO titles generated. Please retry."));

      // Generate 30-day plan with titles
      const today = startOfToday();
      const planItems: any[] = [];

      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const keyword = keywords[i % keywords.length] || selectedBusiness.name;
        const title = titles[i] || `Article SEO ${i + 1}`;

        // Add SEO article
        planItems.push({
          user_id: user!.id,
          business_id: selectedBusiness.id,
          content_type: "seo_article",
          scheduled_date: dateStr,
          status: "pending",
          keyword_used: keyword,
          title: title,
        });
      }

      // Never overwrite generated or already published work when rebuilding
      // the 30-day plan. Retain existing articles and their Google post IDs.
      const { error: insertError } = await supabase
        .from("scheduled_content")
        .upsert(planItems, {
          onConflict: "user_id,business_id,content_type,scheduled_date",
          ignoreDuplicates: true,
        });

      if (insertError) throw insertError;

      await fetchScheduledContent(selectedBusiness.id);
      
      // Update local state
      setSelectedBusiness({
        ...selectedBusiness,
        auto_keywords: keywords,
        description: analysisData?.description || selectedBusiness.description
      });

      toast({ 
        title: t("Plan généré !", "Plan generated!"), 
        description: t(`30 titres d'articles planifiés avec ${keywords.length} mots-clés détectés`, `30 article titles planned with ${keywords.length} keywords detected`)
      });
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({ 
        title: t("Erreur", "Error"), 
        description: error.message || t("Impossible de générer le plan", "Unable to generate plan"), 
        variant: "destructive" 
      });
    }
    setGenerating(false);
  };

  const generateContentForDay = async (item: ScheduledContent) => {
    try {
      if (!selectedBusiness || !isSubscribed) throw new Error("Abonnement ou établissement inactif.");
      const { error: startError } = await supabase
        .from("scheduled_content")
        .update({ status: "generating", error_message: null })
        .eq("id", item.id).eq("user_id", user!.id).eq("business_id", selectedBusiness.id);
      if (startError) throw startError;

      // Refresh UI
      await fetchScheduledContent(selectedBusiness!.id);

      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "seo_article",
          websiteUrl: selectedBusiness?.website || undefined,
          gmbDescription: selectedBusiness?.description || undefined,
          businessName: selectedBusiness?.name,
          businessDescription: selectedBusiness?.description || selectedBusiness?.name,
          location: selectedBusiness?.address || "",
          language: selectedBusiness?.gmb_language || "fr",
          keywords: [item.keyword_used],
          title: item.title,
        },
      });

      if (error || data?.error) {
        let details = data?.message || error?.message;
        if (error && "context" in error) {
          const context = (error as any).context;
          const errorBody = await context?.json?.().catch(() => null);
          details = errorBody?.message || details;
        }
        throw new Error(details || "SEO generation failed");
      }

      const article = data?.article;
      if (typeof article?.content !== "string" || article.content.trim().length < 80) {
        throw new Error(t("L'IA n'a pas renvoyé de contenu SEO valide.", "AI did not return a valid SEO article."));
      }
      const { error: saveError } = await supabase
        .from("scheduled_content")
        .update({
          status: "generated",
          content: article.content,
          title: article?.title || item.title,
          error_message: null,
        })
        .eq("id", item.id).eq("user_id", user!.id).eq("business_id", selectedBusiness.id);
      if (saveError) throw saveError;

      await fetchScheduledContent(selectedBusiness!.id);
      toast({ title: t("Article généré !", "Article generated!") });
    } catch (error: any) {
      await supabase
        .from("scheduled_content")
        .update({ status: "failed", error_message: error.message })
        .eq("id", item.id).eq("user_id", user!.id);
      
      await fetchScheduledContent(selectedBusiness!.id);
      toast({ title: t("Erreur", "Error"), description: error.message, variant: "destructive" });
    }
  };

  // Rework already generated drafts only. Never alter published Google posts or their schedule.
  const rewriteExistingArticles = async () => {
    if (!selectedBusiness || !user || !isSubscribed || rewritingExisting) return;
    const drafts = scheduledContent.filter(item =>
      item.content_type === "seo_article" &&
      item.status === "generated" &&
      Boolean(item.content?.trim()) &&
      !(item as ScheduledContent & { google_post_id?: string | null }).google_post_id
    );
    if (!drafts.length) {
      toast({ title: t("Aucun brouillon à réécrire", "No drafts to rewrite") });
      return;
    }
    if (!window.confirm(t(
      `Réécrire ${drafts.length} article(s) non publiés en style éditorial ? Les dates et titres seront conservés.`,
      `Rewrite ${drafts.length} unpublished article(s) in editorial style? Dates and titles will be preserved.`
    ))) return;

    setRewritingExisting(true);
    let updated = 0;
    let errors = 0;
    try {
      for (const item of drafts) {
        try {
          const { data, error } = await supabase.functions.invoke("generate-seo-content", {
            body: {
              type: "seo_article",
              businessName: selectedBusiness.name,
              businessDescription: selectedBusiness.description || selectedBusiness.name,
              location: selectedBusiness.address || "",
              language: selectedBusiness.gmb_language || "fr",
              keywords: item.keyword_used ? [item.keyword_used] : [],
              title: item.title,
            },
          });
          const content = data?.article?.content?.trim();
          if (error || data?.error || typeof content !== "string" || content.length < 80 || content.length > 1500) {
            throw new Error(data?.error || error?.message || "Invalid Google Business post");
          }
          // Re-check server state before saving to avoid modifying a post published during the rewrite.
          const { data: current, error: readError } = await supabase.from("scheduled_content")
            .select("id,status,google_post_id")
            .eq("id", item.id).eq("user_id", user.id).eq("business_id", selectedBusiness.id)
            .single();
          if (readError || current?.status !== "generated" || current?.google_post_id) continue;
          const { data: saved, error: saveError } = await supabase.from("scheduled_content")
            .update({ content, error_message: null })
            .eq("id", item.id).eq("user_id", user.id).eq("business_id", selectedBusiness.id)
            .eq("status", "generated").is("google_post_id", null).select("id");
          if (saveError || !saved?.length) throw saveError || new Error("Draft no longer editable");
          updated++;
        } catch (error) {
          console.error("Editorial rewrite failed for draft", item.id, error);
          errors++;
        }
      }
      await fetchScheduledContent(selectedBusiness.id);
      toast({
        title: t(`${updated} article(s) réécrit(s)`, `${updated} article(s) rewritten`),
        description: errors ? t(`${errors} échec(s), brouillons originaux conservés.`, `${errors} failed; original drafts retained.`) : t("Planification conservée.", "Schedule preserved."),
      });
    } finally {
      setRewritingExisting(false);
    }
  };

  const publishToGMB = async (item: ScheduledContent) => {
    if (!item.content) {
      toast({ title: t("Erreur", "Error"), description: t("L'article doit d'abord être généré", "The article must be generated first"), variant: "destructive" });
      return;
    }

    setPublishing(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("publish-gmb-post", {
        body: {
          business_id: selectedBusiness!.id,
          // Google Business posts are short plain-text updates, not full articles.
          summary: [item.title, item.content].filter(Boolean).join("\n\n")
            .replace(/[#*_~`]/g, "").replace(/\[(.*?)\]\((.*?)\)/g, "$1")
            .slice(0, 1500),
          scheduled_content_id: item.id,
          topic_type: "STANDARD",
        },
      });

      if (error) throw error;
      
      if (data?.requires_reconnect) {
        toast({ 
          title: t("Reconnexion requise", "Reconnection required"), 
          description: t("Reconnectez-vous avec Google depuis le Tableau de bord", "Reconnect with Google from the Dashboard"), 
          variant: "destructive" 
        });
        setPublishing(null);
        return;
      }

      if (data?.success === false) {
        throw new Error(data.error || "Publication failed");
      }

      await fetchScheduledContent(selectedBusiness!.id);
      const live = data?.state === "LIVE";
      toast({
        title: live ? t("Publié sur Google", "Published on Google") : t("Post transmis à Google", "Post submitted to Google"),
        description: live ? t("La publication est en ligne.", "Post is live.") : t("Publication reçue, en attente de validation Google. Aucun succès définitif annoncé.", "Submitted for Google moderation; not confirmed live."),
      });
    } catch (error: any) {
      console.error("Error publishing:", error);
      toast({ 
        title: t("Erreur de publication", "Publishing error"), 
        description: error.message || t("Impossible de publier sur Google", "Unable to publish on Google"), 
        variant: "destructive" 
      });
    }
    setPublishing(null);
  };

  const handlePublishTimeChange = async (hour: number) => {
    setPublicationHour(hour);
    // Save to ai_settings
    const { error } = await supabase
      .from("ai_settings")
      .update({ publication_hour: hour } as any)
      .eq("user_id", user!.id);
    
    if (error) {
      console.error("Error saving publication hour:", error);
      toast({
        title: t("Erreur", "Error"),
        description: t("Impossible d'enregistrer l'heure de publication", "Unable to save publication time"),
        variant: "destructive"
      });
    } else {
      toast({
        title: t("Heure mise à jour", "Time updated"),
        description: isEN
          ? `Automatic publishing will happen at ${hour.toString().padStart(2, "0")}:00 UTC`
          : `La publication automatique aura lieu à ${hour.toString().padStart(2, "0")}:00 UTC`,
      });
    }
  };

  const getStatusBadge = (status: string, iconOnly: boolean = false) => {
    if (iconOnly) {
      switch (status) {
        case "published":
          return <Check className="w-4 h-4 text-secondary" />;
        case "generated":
          return <BrandSparkle className="w-4 h-4 text-primary" />;
        case "generating":
          return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
        case "failed":
        case "error":
          return <AlertCircle className="w-4 h-4 text-destructive" />;
        default:
          return <Clock className="w-4 h-4 text-muted-foreground" />;
      }
    }
    
    switch (status) {
      case "processing":
        return <Badge variant="outline">{t("Modération Google", "Google moderation")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t("Refusé par Google", "Rejected by Google")}</Badge>;
      case "published":
        return <Badge className="bg-secondary text-secondary-foreground"><Check className="w-3 h-3 mr-1" />{t("Publié", "Published")}</Badge>;
      case "generated":
        return <Badge className="bg-primary text-primary-foreground"><BrandSparkle className="w-3 h-3 mr-1" />{t("Prêt", "Ready")}</Badge>;
      case "generating":
        return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />{t("En cours", "In progress")}</Badge>;
      case "failed":
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />{t("Échec", "Failed")}</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t("Planifié", "Scheduled")}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">

        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const today = startOfToday();
  const next30Days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  return (
    <div className="min-h-screen bg-muted/30 pb-20">


      {/* Mobile-First Page Header */}
      <div className="bg-card border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">SEO & GEO AutoPost</h1>
              <p className="text-xs text-muted-foreground">
                {t("Planification automatique sur 30 jours", "30-day automatic planning")}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline"
            className="w-full mb-3 gap-2" onClick={manageLocations}>
            <Building2 className="h-4 w-4" />
            {t("Gérer mes établissements SEO & GEO", "Manage my SEO & GEO locations")}
          </Button>
          {selectedBusiness && (
            <Button
              onClick={analyzeAndGeneratePlan}
              disabled={generating}
              className="w-full"
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Analyse en cours...", "Analyzing...")}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("Analyser & Planifier", "Analyze & Plan")}
                </>
              )}
            </Button>
          )}
          {selectedBusiness && isSubscribed && (
            <div className="w-full text-xs text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              {t("SEO activé — publication soumise à Google et à sa modération.", "SEO enabled — Google may moderate or reject posts.")}
            </div>
          )}
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Business Selection */}
        {businesses.length === 0 ? (
          <Card className="p-6 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-base font-medium text-foreground mb-2">{t("Aucun établissement", "No business")}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t("Connectez d'abord votre fiche Google Business", "Connect your Google Business Profile first")}
            </p>
            <Button onClick={() => navigate("/businesses")} size="sm">
              {t("Ajouter un établissement", "Add a business")}
            </Button>
          </Card>
        ) : (
          <>
            {/* Business Selector - Google Style like Reviews */}
            {selectedBusiness && (
              <Card className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Google Logo */}
                    <div className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center shadow-xs flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    
                    {/* Business name with dropdown dialog */}
                    <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-1.5 hover:bg-muted rounded-lg px-2 py-1.5 transition-colors border border-transparent hover:border-border flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {selectedBusiness.name}
                          </span>
                          {businesses.length > 1 && <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t("Vos établissements", "Your businesses")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-1 mt-4">
                          {businesses.map((business) => {
                            const isSelected = selectedBusiness?.id === business.id;
                            const bgColor = `hsl(${business.name.charCodeAt(0) * 15 % 360}, 60%, 50%)`;
                            
                            return (
                              <button
                                key={business.id}
                                onClick={() => {
                                  setSelectedBusiness(business);
                                  if (user) localStorage.setItem("googlereviewai.com_selected_business_" + user.id, business.id);
                                  fetchScheduledContent(business.id);
                                  setBusinessDialogOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                  isSelected ? "bg-muted" : "hover:bg-muted/50"
                                }`}
                              >
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                  style={{ backgroundColor: bgColor }}
                                >
                                  {business.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <div className="font-medium truncate text-sm">{business.name}</div>
                                  {business.address && (
                                    <div className="text-xs text-muted-foreground truncate">{business.address}</div>
                                  )}
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Keywords section */}
                  {selectedBusiness.auto_keywords && selectedBusiness.auto_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
                      {selectedBusiness.auto_keywords.slice(0, 6).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">
                          {kw}
                        </span>
                      ))}
                      {selectedBusiness.auto_keywords.length > 6 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{selectedBusiness.auto_keywords.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SEO is included in Pro/Business; do not sell outdated per-location modules. */}
            {!isSubscribed && (
              <Card className="p-4 border-primary/30">
                <p className="text-sm font-medium">{t("Le SEO automatique est inclus dans Pro et Business", "SEO automation is included in Pro and Business")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("Choisissez un forfait pour générer des articles et gérer vos établissements actifs.", "Choose a plan to generate articles for your selected locations.")}</p>
                <Button size="sm" className="mt-3" onClick={() => setSeoUpgradeOpen(true)}>
                  {t("Voir les forfaits", "View plans")}
                </Button>
              </Card>
            )}

            {/* SEO operational monitoring: publication counts are not search-result metrics. */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("Monitoring SEO", "SEO monitoring")}</CardTitle>
                <CardDescription>{t("Suivi des publications de cet établissement, distinct des résultats de visibilité.", "Track this location's publishing actions separately from visibility outcomes.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: t("Planifiés", "Scheduled"), count: scheduledContent.length },
                    { label: t("Publiés", "Published"), count: scheduledContent.filter(x => x.status === "published").length },
                    { label: t("Prêts", "Ready"), count: scheduledContent.filter(x => x.status === "generated").length },
                    { label: t("En modération", "In moderation"), count: scheduledContent.filter(x => x.status === "processing").length },
                    { label: t("Échecs / refus", "Failed / rejected"), count: scheduledContent.filter(x => ["failed", "error", "rejected"].includes(x.status)).length },
                  ].map(metric => (
                    <div key={metric.label} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-semibold tabular-nums">{metric.count}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => navigate("/geo-rank")}>{t("Positions Google Maps", "Google Maps rankings")}</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>{t("Statistiques Google Business", "Google Business insights")}</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{t("Les citations ChatGPT, Gemini et Claude ne sont pas encore mesurées. Le nombre de publications ne prouve pas une hausse du classement.", "ChatGPT, Gemini and Claude citations are not yet measured. Publishing activity is not evidence of ranking gains.")}</p>
              </CardContent>
            </Card>

            {/* Articles - Mobile optimized */}
            <Tabs value="articles" onValueChange={() => {}}>
              {/* Auto-publish info with time selector */}
              <div className="flex items-center justify-between mt-3 p-2 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t("Publication auto :", "Auto publish:")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={publicationHour}
                    onChange={(e) => handlePublishTimeChange(parseInt(e.target.value))}
                    className="h-7 text-xs bg-background border border-border rounded-md px-2 font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 UTC
                      </option>
                    ))}
                  </select>
                  <Badge variant="secondary" className="text-[10px]">{t("Quotidien", "Daily")}</Badge>
                </div>
              </div>

              {isSubscribed && scheduledContent.some(item => item.content_type === "seo_article" && item.status === "generated" && item.content?.trim() && !(item as ScheduledContent & { google_post_id?: string | null }).google_post_id) && (
                <Button variant="outline" size="sm" className="mt-3 w-full" disabled={rewritingExisting} onClick={rewriteExistingArticles}>
                  {rewritingExisting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  {t("Réécrire les articles déjà générés", "Rewrite existing generated articles")}
                </Button>
              )}

              {/* Articles Tab - Mobile optimized */}
              <TabsContent value="articles" className="mt-3 space-y-2">
                {scheduledContent.filter(c => c.content_type === "seo_article").length === 0 ? (
                  <Card className="p-5 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <h3 className="text-sm font-medium text-foreground mb-1">{t("Aucun article planifié", "No scheduled article")}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t("Cliquez sur « Analyser & Planifier » pour générer 30 titres d'articles", "Click \"Analyze & Plan\" to generate 30 article titles")}
                    </p>
                  </Card>
                ) : (
                  scheduledContent
                    .filter(c => c.content_type === "seo_article")
                    .map((item) => (
                      <Card 
                        key={item.id} 
                        className="active:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handlePreviewArticle(item)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {getStatusBadge(item.status)}
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(item.scheduled_date), "d MMM", { locale: isEN ? enUS : fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewArticle(item);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {isSubscribed && ["pending", "failed"].includes(item.status) && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateContentForDay(item);
                                  }}
                                >
                                  <BrandSparkle className="w-3 h-3" />
                                </Button>
                              )}
                              {isSubscribed && item.status === "generated" && (
                                <Button 
                                  size="sm" 
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    publishToGMB(item);
                                  }}
                                  disabled={publishing === item.id || Boolean((item as ScheduledContent & { google_post_id?: string | null }).google_post_id)}
                                >
                                  {publishing === item.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Send className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isSubscribed && item.status !== "pending" && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            <p className={`font-medium text-xs ${isSubscribed || item.status === "pending" ? "text-foreground" : "text-muted-foreground"} line-clamp-2`}>
                              {item.title || t("Article en attente", "Pending article")}
                            </p>
                          </div>
                          {item.keyword_used && (
                            <span className="inline-block mt-1.5 text-[10px] bg-muted px-2 py-0.5 rounded-full">
                              {item.keyword_used}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <ManageLocationsDialog
        open={manageBusinessesOpen}
        onOpenChange={setManageBusinessesOpen}
        onSuccess={() => fetchData()}
      />

      {/* Article Preview Dialog */}
      <UpgradeDialog open={seoUpgradeOpen} onOpenChange={setSeoUpgradeOpen} />
      <ArticlePreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        article={selectedArticle}
        isSubscribed={isSubscribed}
        onSubscribe={() => setSeoUpgradeOpen(true)}
      />
    </div>
  );
};

export default SEOAutoPost;
