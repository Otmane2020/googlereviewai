import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  FileText, 
  Sparkles, 
  Loader2, 
  Calendar,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Building2
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

const SEOAutoPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState("planning");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

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
      .order("scheduled_date", { ascending: true });
    
    setScheduledContent((data as ScheduledContent[]) || []);
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

      // Generate 30-day plan
      const today = startOfToday();
      const planItems: any[] = [];

      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const keyword = keywords[i % keywords.length] || selectedBusiness.name;

        // Add Q&A for AEO
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-secondary text-secondary-foreground"><Check className="w-3 h-3 mr-1" />Publié</Badge>;
      case "generated":
        return <Badge className="bg-primary text-primary-foreground"><Sparkles className="w-3 h-3 mr-1" />Prêt</Badge>;
      case "generating":
        return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours</Badge>;
      case "failed":
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
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">SEO & AEO AutoPost</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Planning automatique 30 jours
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
                        className="text-sm border rounded-md px-2 py-1"
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="planning" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Planning 30 jours
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Contenu généré
                </TabsTrigger>
              </TabsList>

              {/* Planning Tab */}
              <TabsContent value="planning" className="mt-4">
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {next30Days.map((date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const dayContent = scheduledContent.find(
                      c => c.scheduled_date === dateStr && c.content_type === "aeo_qa"
                    );
                    const isToday = isSameDay(date, today);

                    return (
                      <div
                        key={dateStr}
                        className={`p-2 sm:p-3 rounded-lg border text-center transition-all ${
                          isToday 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {format(date, "EEE", { locale: fr })}
                        </p>
                        <p className={`text-sm sm:text-base font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                          {format(date, "d")}
                        </p>
                        <div className="mt-1">
                          {dayContent ? (
                            <div 
                              className="cursor-pointer"
                              onClick={() => dayContent.status === "pending" && generateContentForDay(dayContent)}
                            >
                              {getStatusBadge(dayContent.status)}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="mt-4 space-y-3">
                {scheduledContent.filter(c => c.question || c.answer).length === 0 ? (
                  <Card className="p-6 text-center">
                    <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Aucun contenu généré. Cliquez sur une date planifiée pour générer.
                    </p>
                  </Card>
                ) : (
                  scheduledContent
                    .filter(c => c.question || c.answer)
                    .map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item.status)}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.scheduled_date), "d MMM", { locale: fr })}
                              </span>
                            </div>
                            {item.keyword_used && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                {item.keyword_used}
                              </span>
                            )}
                          </div>
                          {item.question && (
                            <p className="font-medium text-foreground text-sm mb-1">
                              Q: {item.question}
                            </p>
                          )}
                          {item.answer && (
                            <p className="text-muted-foreground text-sm">
                              R: {item.answer}
                            </p>
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
    </div>
  );
};

export default SEOAutoPost;
