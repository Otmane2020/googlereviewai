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
  TrendingUp,
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
  website: string | null;
  website_content: string | null; // Pre-scraped content from Firecrawl
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
      // Fetch businesses and AI settings in parallel
      const [businessRes, aiSettingsRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, address, description, categories, auto_keywords, website, website_content")
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
      .eq("content_type", "aeo_qa")
      .order("scheduled_date", { ascending: true });
    
    setScheduledContent((data as ScheduledContent[]) || []);
  };

  const handleSubscribe = async (selectedBusinessIds: string[], annual: boolean = false, quantity: number = 1) => {
    try {
      const priceKey = annual ? "aeo_yearly" : "aeo_monthly";

      // First try to add to existing subscription
      const { data: addData, error: addError } = await supabase.functions.invoke("add-subscription-item", {
        body: { priceKey, quantity }
      });

      if (addData?.success) {
        toast({
          title: "Module activated!",
          description: "The AEO module was added to your subscription.",
        });
        setIsSubscribed(true);
        checkSubscription();
        return;
      }

      // If no active subscription/customer → fallback to checkout
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
        description: error?.message || "Unable to create payment session",
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
      // STEP 1: Delete old unpublished Q&As (replace all)
      await supabase
        .from("scheduled_content")
        .delete()
        .eq("business_id", selectedBusiness.id)
        .eq("user_id", user!.id)
        .eq("content_type", "aeo_qa")
        .neq("status", "published");

      toast({ 
        title: "Analyzing...", 
        description: "Scraping the website with Firecrawl..." 
      });

      // STEP 2: Call analyze-business-website to scrape with Firecrawl
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-business-website",
        {
          body: {
            businessId: selectedBusiness.id,
            website: selectedBusiness.website,
            generateContent: false,
          },
        }
      );

      if (analysisError) throw analysisError;

      // STEP 3: Reload business to get fresh website_content
      const { data: freshBusiness } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", selectedBusiness.id)
        .single();

      const keywords = analysisData?.keywords || (freshBusiness as Business)?.auto_keywords || [];
      const websiteContent = (freshBusiness as Business)?.website_content || null;

      // Update local state
      setSelectedBusiness({
        ...selectedBusiness,
        auto_keywords: keywords,
        website_content: websiteContent,
        description: analysisData?.description || selectedBusiness.description,
      });

      console.log(`[AEO] Website content: ${websiteContent ? websiteContent.length + ' chars' : 'NULL'}`);
      console.log(`[AEO] Keywords: ${keywords.length}`);

      // STEP 4: Create 30-day plan
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

      // Insert the plan
      const { error: insertError } = await supabase
        .from("scheduled_content")
        .upsert(planItems, { 
          onConflict: "user_id,business_id,content_type,scheduled_date"
        });

      if (insertError) throw insertError;

      toast({ 
        title: "Plan created! Generating Q&As...", 
        description: `30 days planned with ${keywords.length} keywords` 
      });

      // STEP 5: Generate all Q&As in batch with websiteContent
      const { data: newItems } = await supabase
        .from("scheduled_content")
        .select("*")
        .eq("business_id", selectedBusiness.id)
        .eq("user_id", user!.id)
        .eq("content_type", "aeo_qa")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true });

      const pendingItems = (newItems as ScheduledContent[]) || [];
      const batchSize = 5;
      let generatedCount = 0;

      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (item) => {
          try {
            await supabase
              .from("scheduled_content")
              .update({ status: "generating" })
              .eq("id", item.id);

            const { data, error } = await supabase.functions.invoke("generate-seo-content", {
              body: {
                type: "aeo_questions",
                businessName: selectedBusiness.name,
                businessDescription: (freshBusiness as Business)?.description || selectedBusiness.description,
                location: selectedBusiness.address || "France",
                websiteContent: websiteContent, // Use freshly scraped content
                keywords: [item.keyword_used],
                singleQuestion: true,
              },
            });

            if (error) throw error;
            if (data?.fallback || data?.error) {
              throw new Error(data?.error === "BILLING_ERROR"
                ? "AI credits exhausted. Top up your balance."
                : (data?.message || "AI service unavailable"));
            }

            const qa = data?.questions?.[0];
            
            await supabase
              .from("scheduled_content")
              .update({ 
                status: qa?.question ? "generated" : "failed",
                question: qa?.question || null,
                answer: qa?.answer || null,
                title: qa?.question || null,
              })
              .eq("id", item.id);

            if (qa?.question) generatedCount++;
          } catch (err: any) {
            console.error(`Error generating Q&A for ${item.id}:`, err);
            await supabase
              .from("scheduled_content")
              .update({ status: "failed", error_message: err.message })
              .eq("id", item.id);
          }
        }));

        // Update UI after each batch
        await fetchScheduledContent(selectedBusiness.id);
      }

      toast({ 
        title: "Done!", 
        description: `${generatedCount} Q&As generated with ${keywords.length} keywords`
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

      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "aeo_questions",
          businessName: selectedBusiness?.name,
          businessDescription: selectedBusiness?.description || selectedBusiness?.name,
          location: selectedBusiness?.address || "France",
          websiteContent: selectedBusiness?.website_content, // Use pre-scraped content from DB
          keywords: [item.keyword_used],
          singleQuestion: true,
        },
      });

      if (error) throw error;
      if (data?.fallback || data?.error) {
        const msg = data?.error === "BILLING_ERROR"
          ? "AI credits exhausted. Top up to continue."
          : data?.message || "AI service temporarily unavailable.";
        await supabase
          .from("scheduled_content")
          .update({ status: "failed", error_message: msg })
          .eq("id", item.id);
        await fetchScheduledContent(selectedBusiness!.id);
        toast({ title: "Generation failed", description: msg, variant: "destructive" });
        return;
      }

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
      toast({ title: "Q&A generated!" });
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
      toast({ title: "Erreur", description: "The Q&A must be generated first", variant: "destructive" });
      return;
    }

    setPublishing(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("publish-gmb-qa", {
        body: {
          content_id: item.id,
        },
      });

      if (error) throw error;
      
      if (data?.requires_reconnect) {
        toast({ 
          title: "Reconnect required", 
          description: "Reconnect with Google from the Dashboard", 
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
        title: "Published to Google!", 
        description: "The Q&A was published on your Google Business Profile" 
      });
    } catch (error: any) {
      console.error("Error publishing:", error);
      toast({ 
        title: "Publishing error", 
        description: error.message || "Unable to publish to Google", 
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
        description: "Could not save the publication hour",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Time updated",
        description: `Auto-publishing will run at ${hour.toString().padStart(2, "0")}:00 UTC`,
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
            <div className="w-10 h-10 rounded-xl bg-[#10a37f]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#10a37f">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                GEO Rank AI
                <Badge variant="secondary" className="text-[10px] px-1.5">AEO</Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                30 jours de Q&R automatiques pour ChatGPT, Perplexity & Google AI
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
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser & Générer
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
                moduleType="aeo"
                onSubscribe={handleSubscribe}
              />
            )}

            {/* Tabs - Mobile optimized */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="planning" className="gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Planning
                </TabsTrigger>
                <TabsTrigger value="articles" className="gap-1.5 text-xs">
                  <List className="w-3.5 h-3.5" />
                  Q&A
                </TabsTrigger>
              </TabsList>

              {/* Auto-publish info with settings icon */}
              <div className="flex items-center justify-between mt-3 p-2 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Auto-publish:</span>
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

              {/* Planning Tab */}
              <TabsContent value="planning" className="mt-3">
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {next30Days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayContent = scheduledContent.find(c => c.scheduled_date === dateStr);
                    const isToday = isSameDay(day, today);
                    
                    return (
                      <Card 
                        key={dateStr}
                        className={`p-2 cursor-pointer transition-all ${
                          isToday ? "ring-2 ring-primary" : ""
                        } ${dayContent?.status === "published" ? "bg-emerald-500/20" : ""}`}
                        onClick={() => {
                          if (dayContent) {
                            handlePreviewArticle(dayContent);
                          }
                        }}
                      >
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {format(day, "EEE")}
                          </p>
                          <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                            {format(day, "d")}
                          </p>
                          {dayContent ? (
                            <div className="mt-1">
                              {dayContent.status === "published" && <Check className="w-4 h-4 mx-auto text-emerald-500" />}
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
                    <Clock className="w-3 h-3" /> Scheduled
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> Ready
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" /> Published
                  </div>
                </div>
              </TabsContent>

              {/* Q&A Tab - Mobile optimized */}
              <TabsContent value="articles" className="mt-3 space-y-2">
                {scheduledContent.length === 0 ? (
                  <Card className="p-5 text-center">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <h3 className="text-sm font-medium text-foreground mb-1">No scheduled Q&A</h3>
                    <p className="text-xs text-muted-foreground">
                      Click "Analyze & Plan" to generate your 30-day plan
                    </p>
                  </Card>
                ) : (
                  scheduledContent.map((item) => (
                    <Card key={item.id} className="active:bg-muted/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getStatusBadge(item.status)}
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(item.scheduled_date), "d MMM")}
                            </span>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {item.question && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handlePreviewArticle(item)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {!item.question && item.status !== "generating" && (
                              <Button 
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => generateContentForDay(item)}
                                disabled={!isSubscribed}
                              >
                                <Sparkles className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {item.question && item.status !== "published" && (
                              <Button 
                                size="sm"
                                className="h-7 px-2 bg-secondary hover:bg-secondary/90"
                                onClick={() => publishToGMB(item)}
                                disabled={publishing === item.id || !isSubscribed}
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
                        
                        {item.question ? (
                          <div>
                            <h4 className="font-medium text-xs text-foreground mb-0.5 line-clamp-2">{item.question}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{item.answer}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Q&A not generated • {item.keyword_used}
                          </p>
                        )}
                        {item.keyword_used && item.question && (
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
        onSubscribe={(annual) => handleSubscribe(businesses.map(b => b.id), annual)}
        onGenerate={(id) => {
          const item = scheduledContent.find(c => c.id === id);
          if (item) {
            setShowPreviewDialog(false);
            generateContentForDay(item);
          }
        }}
        generating={!!scheduledContent.find(c => c.id === selectedArticle?.id && c.status === "generating")}
      />
    </div>
  );
};

export default AEORank;
