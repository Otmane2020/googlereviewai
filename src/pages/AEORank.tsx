import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2,
  Copy,
  Star as StarIcon,
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
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const categories = ["services", "horaires", "localisation", "avis", "prix", "contact"];

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
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  ChatGPT Rank
                  <Badge variant="secondary" className="text-xs">AEO</Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Optimisez votre visibilité sur les IA (ChatGPT, Perplexity...)
                </p>
              </div>
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
                  <SelectContent className="bg-popover">
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
                      Générer les Q&A
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
              <CardTitle>{editingQuestion ? "Modifier la question" : "Ajouter une Q&A"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question *</Label>
                <Input
                  placeholder="Quels sont vos horaires d'ouverture ?"
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Réponse *</Label>
                <Textarea
                  placeholder="Nous sommes ouverts du lundi au samedi de 9h à 19h..."
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
                  <SelectContent className="bg-popover">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune question</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Générez vos premières Q&A pour optimiser votre visibilité IA
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer avec l'IA
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {questions.map((q) => (
              <Card key={q.id} className={q.is_featured ? "border-primary/50 bg-primary/5" : ""}>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {q.is_featured && (
                          <Badge variant="default" className="gap-1">
                            <StarIcon className="w-3 h-3" />
                            Featured
                          </Badge>
                        )}
                        {q.category && (
                          <Badge variant="secondary">{q.category}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(q.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <h4 className="font-medium text-foreground mb-2">{q.question}</h4>
                      <p className="text-sm text-muted-foreground">{q.answer}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleFeatured(q.id, q.is_featured)}>
                        <StarIcon className={`w-4 h-4 ${q.is_featured ? "fill-primary text-primary" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyQA(q)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(q)}>
                        <Edit2 className="w-4 h-4" />
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
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default AEORank;
