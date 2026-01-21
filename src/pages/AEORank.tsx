import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ArticlePreviewDialog } from "@/components/ArticlePreviewDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  Sparkles, 
  Loader2, 
  Calendar,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  Building2,
  Send,
  Lock,
  Eye,
  List,
  TrendingUp
} from "lucide-react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Business {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  categories: string[] | null;
  auto_keywords: string[] | null;
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

const AEORank = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState("planning");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ScheduledContent | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Use subscription verification hook
  const { loading: subscriptionLoading } = useRequireSubscription();

  useEffect(() => {
    if (subscriptionLoading || !user) return;
    fetchData();
    checkSubscription();
  }, [subscriptionLoading, user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    // Check if user has AEO subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("module", "aeo_rank")
      .eq("status", "active")
      .maybeSingle();
    
    // Also check if user has a paid plan (Pro or Business)
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_name")
      .eq("id", user.id)
      .single();
    
    const hasPaidPlan = profile?.plan_name && ["pro", "business"].includes(profile.plan_name.toLowerCase());
    setIsSubscribed(!!subscription || hasPaidPlan);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: businessData } = await supabase
        .from("businesses")
        .select("id, name, address, description, categories, auto_keywords")
        .eq("user_id", user!.id);
      
      setBusinesses((businessData as Business[]) || []);
      
      if (businessData && businessData.length > 0) {
        setSelectedBusiness(businessData[0] as Business);
        await fetchScheduledContent(businessData[0].id);
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
      .eq("content_type", "aeo_qa")
      .order("scheduled_date", { ascending: true });
    
    setScheduledContent((data as ScheduledContent[]) || []);
  };

  const handleSubscribe = async (annual: boolean = false) => {
    try {
      const priceId = annual 
        ? "price_1SrHtSEfti9t9nN9t5NgA002" // AEO Annual
        : "price_1SrHtHEfti9t9nN9Me70ucqf"; // AEO Monthly
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          priceId,
          mode: "subscription"
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive"
      });
    }
  };

  const handlePreviewArticle = (article: ScheduledContent) => {
    setSelectedArticle(article);
    setShowPreviewDialog(true);
  };

  const analyzeAndGeneratePlan = async () => {
    if (!selectedBusiness) return;
    
    setGenerating(true);
    try {
      // Generate keywords from business info using AI
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "analyze_business",
          businessName: selectedBusiness.name,
          businessDescription: selectedBusiness.description || selectedBusiness.name,
          location: selectedBusiness.address || "France",
        },
      });

      if (analysisError) throw analysisError;

      // Update business with auto-detected keywords
      const keywords = analysisData?.keywords || [];
      await supabase
        .from("businesses")
        .update({ 
          auto_keywords: keywords,
          description: analysisData?.description || selectedBusiness.description 
        })
        .eq("id", selectedBusiness.id);

      // Generate 30-day plan for AEO Q&A
      const today = startOfToday();
      const planItems: any[] = [];

      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const keyword = keywords[i % keywords.length] || selectedBusiness.name;

        planItems.push({
          user_id: user!.id,
          business_id: selectedBusiness.id,
          content_type: "aeo_qa",
          scheduled_date: dateStr,
          status: "pending",
          keyword_used: keyword,
        });
      }

      // Insert all planned content
      const { error: insertError } = await supabase
        .from("scheduled_content")
        .upsert(planItems, { 
          onConflict: "user_id,business_id,content_type,scheduled_date",
          ignoreDuplicates: true 
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
        title: "Plan généré !", 
        description: `30 jours de Q&A planifiés avec ${keywords.length} mots-clés détectés` 
      });
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de générer le plan", 
        variant: "destructive" 
      });
    }
    setGenerating(false);
  };

  const generateContentForDay = async (item: ScheduledContent) => {
    try {
      // Update status to generating
      await supabase
        .from("scheduled_content")
        .update({ status: "generating" })
        .eq("id", item.id);

      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "aeo_questions",
          businessName: selectedBusiness?.name,
          businessDescription: selectedBusiness?.description || selectedBusiness?.name,
          location: selectedBusiness?.address || "France",
          keywords: [item.keyword_used],
          singleQuestion: true,
        },
      });

      if (error) throw error;

      const qa = data?.questions?.[0];
      
      await supabase
        .from("scheduled_content")
        .update({ 
          status: "generated",
          question: qa?.question || null,
          answer: qa?.answer || null,
          title: qa?.question || null,
        })
        .eq("id", item.id);

      await fetchScheduledContent(selectedBusiness!.id);
      toast({ title: "Q&A généré !" });
    } catch (error: any) {
      await supabase
        .from("scheduled_content")
        .update({ status: "failed", error_message: error.message })
        .eq("id", item.id);
      
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const publishToGMB = async (item: ScheduledContent) => {
    if (!item.question || !item.answer) {
      toast({ title: "Erreur", description: "Le Q&A doit d'abord être généré", variant: "destructive" });
      return;
    }

    const providerToken = session?.provider_token;
    if (!providerToken) {
      toast({ 
        title: "Connexion requise", 
        description: "Reconnectez-vous avec Google pour publier", 
        variant: "destructive" 
      });
      return;
    }

    setPublishing(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("publish-gmb-qa", {
        body: {
          content_id: item.id,
          provider_token: providerToken,
        },
      });

      if (error) throw error;

      await fetchScheduledContent(selectedBusiness!.id);
      toast({ 
        title: "Publié sur Google !", 
        description: "Le Q&A a été publié sur votre fiche Google My Business" 
      });
    } catch (error: any) {
      console.error("Error publishing:", error);
      toast({ 
        title: "Erreur de publication", 
        description: error.message || "Impossible de publier sur Google", 
        variant: "destructive" 
      });
    }
    setPublishing(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-secondary text-secondary-foreground"><Check className="w-3 h-3 mr-1" />Publié</Badge>;
      case "generated":
        return <Badge className="bg-primary text-primary-foreground"><Sparkles className="w-3 h-3 mr-1" />Prêt</Badge>;
      case "generating":
        return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours</Badge>;
      case "failed":
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Échec</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Planifié</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const today = startOfToday();
  const next30Days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  return (
    <div className="min-h-screen bg-muted/30 pb-20 sm:pb-6">
      <DashboardHeader />

      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  ChatGPT Rank
                  <Badge variant="secondary" className="text-xs">AEO</Badge>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Planning automatique Q&A 30 jours
                </p>
              </div>
            </div>
            {selectedBusiness && (
              <Button onClick={analyzeAndGeneratePlan} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Analyser & Planifier
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Qu'est-ce que l'AEO ?</h3>
                <p className="text-sm text-muted-foreground">
                  L'Answer Engine Optimization optimise votre contenu pour apparaître dans les réponses des IA comme ChatGPT, Perplexity ou Google AI. 
                  Publiez des Q&A pertinentes sur votre fiche Google pour être cité par ces assistants.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Selection */}
        {businesses.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun établissement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connectez d'abord votre Google My Business
            </p>
            <Button onClick={() => navigate("/businesses")}>
              Ajouter un établissement
            </Button>
          </Card>
        ) : (
          <>
            {/* Business Info Card */}
            {selectedBusiness && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedBusiness.name}</CardTitle>
                      <CardDescription>{selectedBusiness.address}</CardDescription>
                    </div>
                    {businesses.length > 1 && (
                      <select 
                        className="text-sm border rounded-md px-2 py-1 bg-background"
                        value={selectedBusiness.id}
                        onChange={(e) => {
                          const biz = businesses.find(b => b.id === e.target.value);
                          if (biz) {
                            setSelectedBusiness(biz);
                            fetchScheduledContent(biz.id);
                          }
                        }}
                      >
                        {businesses.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedBusiness.auto_keywords && selectedBusiness.auto_keywords.length > 0 ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Mots-clés détectés automatiquement :</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedBusiness.auto_keywords.slice(0, 10).map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            {kw}
                          </span>
                        ))}
                        {selectedBusiness.auto_keywords.length > 10 && (
                          <span className="text-xs text-muted-foreground">
                            +{selectedBusiness.auto_keywords.length - 10} autres
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur "Analyser & Planifier" pour détecter automatiquement les mots-clés
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subscription Banner for non-subscribers */}
            {!isSubscribed && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">Module Premium AEO</p>
                        <p className="text-sm text-muted-foreground">Abonnez-vous pour débloquer toutes les fonctionnalités</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => handleSubscribe(false)}>
                        49€/mois
                      </Button>
                      <Button variant="outline" onClick={() => handleSubscribe(true)}>
                        39€/mois (annuel)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="planning" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Planning
                </TabsTrigger>
                <TabsTrigger value="articles" className="gap-2">
                  <List className="w-4 h-4" />
                  Q&A
                </TabsTrigger>
              </TabsList>

              {/* Planning Tab */}
              <TabsContent value="planning" className="mt-4">
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {next30Days.map((day, index) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayContent = scheduledContent.find(c => c.scheduled_date === dateStr);
                    const isToday = isSameDay(day, today);
                    
                    return (
                      <Card 
                        key={dateStr}
                        className={`p-2 cursor-pointer transition-all hover:shadow-md ${
                          isToday ? "ring-2 ring-primary" : ""
                        } ${dayContent?.status === "published" ? "bg-secondary/20" : ""}`}
                        onClick={() => {
                          if (dayContent) {
                            handlePreviewArticle(dayContent);
                          }
                        }}
                      >
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {format(day, "EEE", { locale: fr })}
                          </p>
                          <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                            {format(day, "d")}
                          </p>
                          {dayContent ? (
                            <div className="mt-1">
                              {dayContent.status === "published" && <Check className="w-4 h-4 mx-auto text-secondary" />}
                              {dayContent.status === "generated" && <Sparkles className="w-4 h-4 mx-auto text-primary" />}
                              {dayContent.status === "pending" && <Clock className="w-4 h-4 mx-auto text-muted-foreground" />}
                              {dayContent.status === "generating" && <Loader2 className="w-4 h-4 mx-auto text-primary animate-spin" />}
                              {(dayContent.status === "failed" || dayContent.status === "error") && <AlertCircle className="w-4 h-4 mx-auto text-destructive" />}
                            </div>
                          ) : (
                            <div className="mt-1 h-4" />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Planifié
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> Prêt
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-secondary" /> Publié
                  </div>
                </div>
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="articles" className="mt-4 space-y-4">
                {scheduledContent.length === 0 ? (
                  <Card className="p-8 text-center">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Aucun Q&A planifié</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Cliquez sur "Analyser & Planifier" pour générer votre planning 30 jours
                    </p>
                  </Card>
                ) : (
                  scheduledContent.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {getStatusBadge(item.status)}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.scheduled_date), "d MMMM yyyy", { locale: fr })}
                              </span>
                              {item.keyword_used && (
                                <Badge variant="outline" className="text-xs">
                                  {item.keyword_used}
                                </Badge>
                              )}
                            </div>
                            
                            {item.question ? (
                              <>
                                <h4 className="font-medium text-foreground mb-1">{item.question}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{item.answer}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Q&A non encore généré - Mot-clé: "{item.keyword_used}"
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 flex-shrink-0">
                            {item.question && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePreviewArticle(item)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Voir
                              </Button>
                            )}
                            
                            {!item.question && item.status !== "generating" && (
                              <Button 
                                size="sm"
                                onClick={() => generateContentForDay(item)}
                                disabled={!isSubscribed}
                              >
                                <Sparkles className="w-4 h-4 mr-1" />
                                Générer
                              </Button>
                            )}
                            
                            {item.question && item.status !== "published" && (
                              <Button 
                                size="sm"
                                onClick={() => publishToGMB(item)}
                                disabled={publishing === item.id || !isSubscribed}
                                className="bg-secondary hover:bg-secondary/90"
                              >
                                {publishing === item.id ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-1" />
                                )}
                                Publier
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <MobileBottomNav />

      {/* Preview Dialog */}
      <ArticlePreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        article={selectedArticle ? {
          id: selectedArticle.id,
          title: selectedArticle.title,
          question: selectedArticle.question,
          answer: selectedArticle.answer,
          scheduled_date: selectedArticle.scheduled_date,
          status: selectedArticle.status,
          keyword_used: selectedArticle.keyword_used
        } : null}
        isSubscribed={isSubscribed}
        onSubscribe={() => handleSubscribe(false)}
      />
    </div>
  );
};

export default AEORank;
