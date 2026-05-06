import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BusinessSubscriptionSelector } from "@/components/BusinessSubscriptionSelector";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
import { 
  FileText, 
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
  ChevronDown,
  CheckCircle,
  Settings
} from "lucide-react";
import { format, addDays, startOfToday, isSameDay } from "date-fns";


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

const SEOAutoPost = () => {
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
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [publicationHour, setPublicationHour] = useState(7);

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
      .select("plan_name")
      .eq("id", user.id)
      .single();
    
    const hasPaidPlan = profile?.plan_name && ["pro", "business", "quotidien", "agence", "pro annuel", "business annuel"].includes(profile.plan_name.toLowerCase());
    setIsSubscribed(!!subscription || !!hasPaidPlan);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch businesses and AI settings in parallel
      const [businessRes, aiSettingsRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, address, description, categories, auto_keywords")
          .eq("user_id", user!.id),
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
        setSelectedBusiness(businessRes.data[0] as Business);
        await fetchScheduledContent(businessRes.data[0].id);
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
      .order("scheduled_date", { ascending: true });
    
    setScheduledContent((data as ScheduledContent[]) || []);
  };

  const handleSubscribe = async (selectedBusinessIds: string[], annual: boolean = false, quantity: number = 1) => {
    try {
      const priceKey = annual ? "seo_yearly" : "seo_monthly";

      const { data: addData, error: addError } = await supabase.functions.invoke("add-subscription-item", {
        body: { priceKey, quantity }
      });

      if (addData?.success) {
        toast({
          title: "Module activé !",
          description: "Le module SEO a été ajouté à votre abonnement.",
        });
        setIsSubscribed(true);
        checkSubscription();
        return;
      }

      const needsCheckout =
        addData?.requiresCheckout ||
        addError?.message?.includes("No active subscription") ||
        addError?.message?.includes("No Stripe customer");

      if (needsCheckout) {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { priceKey, quantity, selectedBusinessIds }
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        }
      } else if (addError) {
        throw addError;
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de créer la session de paiement",
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

      // Generate 30 article titles
      const { data: titlesData, error: titlesError } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "article_titles",
          businessName: selectedBusiness.name,
          businessDescription: analysisData?.description || selectedBusiness.description || selectedBusiness.name,
          location: selectedBusiness.address || "France",
          keywords: keywords,
          count: 30,
        },
      });

      if (titlesError) throw titlesError;

      const titles = titlesData?.titles || [];

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

      // Insert all planned content - use ignoreDuplicates: false to replace existing titles
      const { error: insertError } = await supabase
        .from("scheduled_content")
        .upsert(planItems, { 
          onConflict: "user_id,business_id,content_type,scheduled_date",
          ignoreDuplicates: false 
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
        description: `30 article titles planned with ${keywords.length} keywords detected` 
      });
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Unable to generate plan", 
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

      // Refresh UI
      await fetchScheduledContent(selectedBusiness!.id);

      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "seo_article",
          businessName: selectedBusiness?.name,
          businessDescription: selectedBusiness?.description || selectedBusiness?.name,
          location: selectedBusiness?.address || "France",
          keywords: [item.keyword_used],
          title: item.title,
        },
      });

      if (error) throw error;

      const article = data?.article;
      
      await supabase
        .from("scheduled_content")
        .update({ 
          status: "generated",
          content: article?.content || null,
          title: article?.title || item.title,
        })
        .eq("id", item.id);

      await fetchScheduledContent(selectedBusiness!.id);
      toast({ title: "Article généré !" });
    } catch (error: any) {
      await supabase
        .from("scheduled_content")
        .update({ status: "failed", error_message: error.message })
        .eq("id", item.id);
      
      await fetchScheduledContent(selectedBusiness!.id);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const publishToGMB = async (item: ScheduledContent) => {
    if (!item.content) {
      toast({ title: "Erreur", description: "L'article doit d'abord être généré", variant: "destructive" });
      return;
    }

    setPublishing(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("publish-gmb-post", {
        body: {
          business_id: selectedBusiness!.id,
          summary: item.content.slice(0, 1500),
          post_id: item.id,
        },
      });

      if (error) throw error;
      
      if (data?.requires_reconnect) {
        toast({ 
          title: "Reconnexion requise", 
          description: "Reconnectez-vous avec Google depuis le Tableau de bord", 
          variant: "destructive" 
        });
        setPublishing(null);
        return;
      }

      if (data?.success === false) {
        throw new Error(data.error || "Publication failed");
      }

      await fetchScheduledContent(selectedBusiness!.id);
      toast({ 
        title: "Publié sur Google !", 
        description: "L'article a été publié sur votre fiche Google Business" 
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
        title: "Erreur",
        description: "Impossible d'enregistrer l'heure de publication",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Heure mise à jour",
        description: `La publication automatique aura lieu à ${hour.toString().padStart(2, "0")}:00 UTC`,
      });
    }
  };

  const getStatusBadge = (status: string, iconOnly: boolean = false) => {
    if (iconOnly) {
      switch (status) {
        case "published":
          return <Check className="w-4 h-4 text-secondary" />;
        case "generated":
          return <Sparkles className="w-4 h-4 text-primary" />;
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
    <div className="min-h-screen bg-muted/30 pb-20">
      <DashboardHeader />

      {/* Mobile-First Page Header */}
      <div className="bg-card border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">SEO & AEO AutoPost</h1>
              <p className="text-xs text-muted-foreground">
                30-day automatic planning
              </p>
            </div>
          </div>
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
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analyze & Plan
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Business Selection */}
        {businesses.length === 0 ? (
          <Card className="p-6 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-base font-medium text-foreground mb-2">Aucun établissement</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Connect your Google Business Profile first
            </p>
            <Button onClick={() => navigate("/businesses")} size="sm">
              Add a business
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
                    <div className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center shadow-sm flex-shrink-0">
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
                          <DialogTitle>Vos établissements</DialogTitle>
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

            {/* Subscription Banner with Business Selector */}
            {!isSubscribed && (
              <BusinessSubscriptionSelector
                businesses={businesses}
                moduleType="seo"
                onSubscribe={handleSubscribe}
              />
            )}

            {/* Articles - Mobile optimized */}
            <Tabs value="articles" onValueChange={() => {}}>
              {/* Auto-publish info with time selector */}
              <div className="flex items-center justify-between mt-3 p-2 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Publication auto :</span>
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
                  <Badge variant="secondary" className="text-[10px]">Quotidien</Badge>
                </div>
              </div>

              {/* Articles Tab - Mobile optimized */}
              <TabsContent value="articles" className="mt-3 space-y-2">
                {scheduledContent.filter(c => c.content_type === "seo_article").length === 0 ? (
                  <Card className="p-5 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <h3 className="text-sm font-medium text-foreground mb-1">No scheduled article</h3>
                    <p className="text-xs text-muted-foreground">
                      Click "Analyze & Plan" to generate 30 article titles
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
                                {format(new Date(item.scheduled_date), "d MMM")}
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
                              {isSubscribed && item.status === "pending" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateContentForDay(item);
                                  }}
                                >
                                  <Sparkles className="w-3 h-3" />
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
                                  disabled={publishing === item.id}
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
                              {item.title || "Pending article"}
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

      <MobileBottomNav />

      {/* Article Preview Dialog */}
      <ArticlePreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        article={selectedArticle}
        isSubscribed={isSubscribed}
        onSubscribe={(annual) => handleSubscribe(businesses.map(b => b.id), annual)}
      />
    </div>
  );
};

export default SEOAutoPost;
