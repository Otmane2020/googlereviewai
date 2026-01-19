import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
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
  Edit, 
  Trash2,
  Copy,
  ExternalLink,
  Home,
  Star,
  Building2,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Bell
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      // Fetch businesses
      const { data: businessData } = await supabase
        .from("businesses")
        .select("id, name, address")
        .eq("user_id", user!.id);
      
      setBusinesses(businessData || []);

      // Fetch articles
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

      // Save article to database
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

  const navItems = [
    { label: "Accueil", icon: Home, href: "/dashboard" },
    { label: "Avis", icon: Star, href: "/reviews" },
    { label: "SEO", icon: FileText, href: "/seo-autopost" },
    { label: "AEO", icon: Sparkles, href: "/aeo-rank" },
    { label: "Paramètres", icon: Settings, href: "/settings" },
  ];

  const isActive = (href: string) => location.pathname === href;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col pb-20 lg:pb-0">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <StarlinkoLogo showBadge={false} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Side Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card shadow-2xl animate-slide-in-right">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground truncate max-w-[180px]">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={signOut}>
                <LogOut className="w-5 h-5 mr-3" />
                Déconnexion
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <StarlinkoLogo showBadge={false} />
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href) ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={signOut}>
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="hidden lg:flex sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SEO AutoPost</h1>
            <p className="text-sm text-muted-foreground">Générez des articles optimisés pour le référencement</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel article
          </Button>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">SEO AutoPost</h1>
              <p className="text-sm text-muted-foreground">Articles optimisés</p>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

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
                      <SelectContent>
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

          {/* Article Preview Modal */}
          {selectedArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setSelectedArticle(null)} />
              <Card className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="truncate pr-4">{selectedArticle.title}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, "<br />") }} />
                  </div>
                </CardContent>
                <div className="p-4 border-t border-border flex justify-end gap-2">
                  <Button variant="outline" onClick={() => copyContent(selectedArticle.content)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default SEOAutoPost;
