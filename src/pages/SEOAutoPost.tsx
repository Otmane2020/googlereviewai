import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  FileText, 
  Sparkles, 
  Globe, 
  MapPin, 
  Loader2, 
  Plus, 
  Eye, 
  Trash2,
  Copy,
  X
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  address: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  keywords: string[] | null;
  status: string;
  created_at: string;
  business_id: string | null;
}

const SEOAutoPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Form state
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [keywords, setKeywords] = useState("");

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
        .select("id, name, address")
        .eq("user_id", user!.id);
      
      setBusinesses(businessData || []);

      const { data: articleData } = await supabase
        .from("seo_articles")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      setArticles(articleData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const generateArticle = async () => {
    if (!selectedBusiness) {
      toast({ title: "Erreur", description: "Sélectionnez un établissement", variant: "destructive" });
      return;
    }

    const business = businesses.find(b => b.id === selectedBusiness);
    if (!business) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          type: "seo_article",
          businessName: business.name,
          businessDescription: businessDescription || `${business.name} - Établissement local`,
          location: businessLocation || business.address || "France",
          sourceUrl,
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
        },
      });

      if (error) throw error;

      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: newArticle, error: insertError } = await supabase
        .from("seo_articles")
        .insert({
          user_id: user!.id,
          business_id: selectedBusiness,
          title: data.title,
          slug: slug,
          content: data.content,
          meta_description: data.meta_description,
          keywords: data.keywords,
          source_url: sourceUrl || null,
          location: businessLocation || business.address,
          status: "draft",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setArticles([newArticle, ...articles]);
      setShowForm(false);
      resetForm();
      
      toast({ title: "Article généré !", description: "Votre article SEO est prêt" });
    } catch (error: any) {
      console.error("Error generating article:", error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de générer l'article", 
        variant: "destructive" 
      });
    }
    setGenerating(false);
  };

  const resetForm = () => {
    setSelectedBusiness("");
    setBusinessDescription("");
    setBusinessLocation("");
    setSourceUrl("");
    setKeywords("");
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from("seo_articles").delete().eq("id", id);
    if (!error) {
      setArticles(articles.filter(a => a.id !== id));
      toast({ title: "Article supprimé" });
    }
  };

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Contenu copié !" });
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

  return (
    <div className="min-h-screen bg-muted/30">
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
                <h1 className="text-2xl font-bold text-foreground">SEO AutoPost</h1>
                <p className="text-sm text-muted-foreground">
                  Générez des articles optimisés pour le référencement
                </p>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel article
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Generation Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Générer un article SEO
              </CardTitle>
              <CardDescription>
                L'IA va créer un article optimisé pour le référencement local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Établissement *</Label>
                  <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un établissement" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Localisation</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Paris, France"
                      value={businessLocation}
                      onChange={(e) => setBusinessLocation(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description de l'activité</Label>
                <Textarea
                  placeholder="Décrivez votre activité, vos services, votre spécialité..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>URL source (optionnel)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://votresite.com/page"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mots-clés (séparés par des virgules)</Label>
                <Input
                  placeholder="restaurant italien, pizza, livraison"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Annuler
                </Button>
                <Button onClick={generateArticle} disabled={generating || !selectedBusiness}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer l'article
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Article Preview Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{selectedArticle.title}</CardTitle>
                  {selectedArticle.meta_description && (
                    <CardDescription className="mt-2">{selectedArticle.meta_description}</CardDescription>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh]">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, "<br/>") }} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Articles List */}
        {articles.length === 0 && !showForm ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun article</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Générez votre premier article SEO optimisé
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un article
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Card key={article.id} className="overflow-hidden">
                <div className="p-4 lg:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={article.status === "published" ? "default" : "secondary"}>
                          {article.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground truncate">{article.title}</h3>
                      {article.meta_description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.meta_description}</p>
                      )}
                      {article.keywords && article.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.keywords.slice(0, 5).map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(article)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyContent(article.content)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteArticle(article.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SEOAutoPost;
