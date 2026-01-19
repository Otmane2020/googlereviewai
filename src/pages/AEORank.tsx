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
  MessageCircle, 
  Sparkles, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2,
  Copy,
  Star as StarIcon,
  Home,
  Star,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  HelpCircle,
  TrendingUp
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  address: string | null;
}

interface Question {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  keywords: string[] | null;
  is_featured: boolean;
  created_at: string;
  business_id: string | null;
}

const AEORank = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  // Manual Q&A form
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [manualCategory, setManualCategory] = useState("");

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

      const { data: questionData } = await supabase
        .from("aeo_questions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      setQuestions(questionData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const generateQuestions = async () => {
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
          type: "aeo_questions",
          businessName: business.name,
          businessDescription: businessDescription || `${business.name} - Établissement local`,
          location: business.address || "France",
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
        },
      });

      if (error) throw error;

      if (data.questions && data.questions.length > 0) {
        // Save questions to database
        const questionsToInsert = data.questions.map((q: any) => ({
          user_id: user!.id,
          business_id: selectedBusiness,
          question: q.question,
          answer: q.answer,
          category: q.category || null,
          keywords: keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
        }));

        const { data: newQuestions, error: insertError } = await supabase
          .from("aeo_questions")
          .insert(questionsToInsert)
          .select();

        if (insertError) throw insertError;

        setQuestions([...(newQuestions || []), ...questions]);
        setShowForm(false);
        resetForm();
        
        toast({ title: "Questions générées !", description: `${data.questions.length} Q&A créées` });
      } else {
        toast({ title: "Aucune question générée", description: "Essayez avec plus de détails", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error generating questions:", error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de générer les questions", 
        variant: "destructive" 
      });
    }
    setGenerating(false);
  };

  const saveManualQuestion = async () => {
    if (!manualQuestion || !manualAnswer) {
      toast({ title: "Erreur", description: "Question et réponse requises", variant: "destructive" });
      return;
    }

    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from("aeo_questions")
          .update({
            question: manualQuestion,
            answer: manualAnswer,
            category: manualCategory || null,
          })
          .eq("id", editingQuestion.id);

        if (error) throw error;

        setQuestions(questions.map(q => 
          q.id === editingQuestion.id 
            ? { ...q, question: manualQuestion, answer: manualAnswer, category: manualCategory || null }
            : q
        ));
        toast({ title: "Question mise à jour !" });
      } else {
        const { data, error } = await supabase
          .from("aeo_questions")
          .insert({
            user_id: user!.id,
            business_id: selectedBusiness || null,
            question: manualQuestion,
            answer: manualAnswer,
            category: manualCategory || null,
          })
          .select()
          .single();

        if (error) throw error;

        setQuestions([data, ...questions]);
        toast({ title: "Question ajoutée !" });
      }

      setEditingQuestion(null);
      setManualQuestion("");
      setManualAnswer("");
      setManualCategory("");
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from("aeo_questions").delete().eq("id", id);
    if (!error) {
      setQuestions(questions.filter(q => q.id !== id));
      toast({ title: "Question supprimée" });
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("aeo_questions")
      .update({ is_featured: !current })
      .eq("id", id);
    
    if (!error) {
      setQuestions(questions.map(q => q.id === id ? { ...q, is_featured: !current } : q));
    }
  };

  const copyQA = (q: Question) => {
    navigator.clipboard.writeText(`Q: ${q.question}\nR: ${q.answer}`);
    toast({ title: "Copié !" });
  };

  const resetForm = () => {
    setSelectedBusiness("");
    setBusinessDescription("");
    setKeywords("");
  };

  const startEdit = (q: Question) => {
    setEditingQuestion(q);
    setManualQuestion(q.question);
    setManualAnswer(q.answer);
    setManualCategory(q.category || "");
  };

  const navItems = [
    { label: "Accueil", icon: Home, href: "/dashboard" },
    { label: "Avis", icon: Star, href: "/reviews" },
    { label: "SEO", icon: FileText, href: "/seo-autopost" },
    { label: "AEO", icon: Sparkles, href: "/aeo-rank" },
    { label: "Paramètres", icon: Settings, href: "/settings" },
  ];

  const isActive = (href: string) => location.pathname === href;

  const categories = ["services", "horaires", "localisation", "avis", "prix", "contact"];

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
                <p className="font-medium text-foreground truncate max-w-[180px]">{user?.email}</p>
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              ChatGPT Rank
              <Badge variant="secondary" className="text-xs">AEO</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">Optimisez votre visibilité sur les IA (ChatGPT, Perplexity...)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditingQuestion(null); setManualQuestion(""); setManualAnswer(""); setManualCategory(""); }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Q&A
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer avec IA
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">ChatGPT Rank</h1>
                <p className="text-sm text-muted-foreground">Questions & Réponses AEO</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingQuestion(null); setManualQuestion(""); setManualAnswer(""); }}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

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
                    Créez des Q&A pertinentes pour que votre entreprise soit citée par ces assistants.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Generation Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Générer des Q&A avec l'IA
                </CardTitle>
                <CardDescription>
                  L'IA va créer des paires question-réponse optimisées pour les moteurs de réponse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label>Description de l'activité</Label>
                  <Textarea
                    placeholder="Décrivez votre activité, vos services principaux..."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mots-clés (séparés par des virgules)</Label>
                  <Input
                    placeholder="restaurant, cuisine française, réservation"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button onClick={generateQuestions} disabled={generating || !selectedBusiness}>
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Générer 5 Q&A
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Q&A Form */}
          {(manualQuestion !== "" || manualAnswer !== "" || editingQuestion) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  {editingQuestion ? "Modifier la Q&A" : "Ajouter une Q&A manuellement"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Input
                    placeholder="Quels sont les horaires d'ouverture ?"
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Réponse *</Label>
                  <Textarea
                    placeholder="Notre établissement est ouvert du lundi au samedi de 9h à 19h..."
                    value={manualAnswer}
                    onChange={(e) => setManualAnswer(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={manualCategory} onValueChange={setManualCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setEditingQuestion(null); setManualQuestion(""); setManualAnswer(""); setManualCategory(""); }}>
                    Annuler
                  </Button>
                  <Button onClick={saveManualQuestion}>
                    {editingQuestion ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions List */}
          {questions.length === 0 && !showForm ? (
            <Card className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune Q&A</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez des questions-réponses pour optimiser votre visibilité sur ChatGPT
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer avec l'IA
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {questions.length} Question{questions.length > 1 ? "s" : ""} & Réponse{questions.length > 1 ? "s" : ""}
                </h2>
              </div>
              <div className="grid gap-4">
                {questions.map((q) => (
                  <Card key={q.id} className={q.is_featured ? "border-primary/50 bg-primary/5" : ""}>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {q.is_featured && (
                              <Badge variant="default" className="bg-primary">
                                <StarIcon className="w-3 h-3 mr-1" />
                                Vedette
                              </Badge>
                            )}
                            {q.category && (
                              <Badge variant="secondary">{q.category}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(q.created_at).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">
                            <span className="text-primary">Q:</span> {q.question}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            <span className="text-secondary font-medium">R:</span> {q.answer}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleFeatured(q.id, q.is_featured)}
                            className={q.is_featured ? "text-primary" : ""}
                          >
                            <StarIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(q)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => copyQA(q)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteQuestion(q.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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

export default AEORank;
