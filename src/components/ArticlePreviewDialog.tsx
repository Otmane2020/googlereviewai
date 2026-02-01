import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Lock, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ArticlePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: {
    id: string;
    title: string | null;
    question: string | null;
    answer: string | null;
    scheduled_date: string;
    status: string;
    keyword_used: string | null;
  } | null;
  isSubscribed: boolean;
  onSubscribe: (annual?: boolean) => void;
  onGenerate?: (id: string) => void;
  generating?: boolean;
}

export const ArticlePreviewDialog = ({
  open,
  onOpenChange,
  article,
  isSubscribed,
  onSubscribe,
  onGenerate,
  generating = false,
}: ArticlePreviewDialogProps) => {
  if (!article) return null;

  const hasContent = article.question || article.answer;
  const isGenerating = article.status === "generating" || generating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={article.status === "published" ? "default" : article.status === "generated" ? "secondary" : "outline"}>
              {article.status === "published" ? "Publié" : article.status === "generated" ? "Prêt" : isGenerating ? "Génération..." : "Planifié"}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(article.scheduled_date), "d MMMM yyyy", { locale: fr })}
            </span>
          </div>
          <DialogTitle className="text-left">
            {article.question || article.title || "Contenu planifié"}
          </DialogTitle>
          {article.keyword_used && (
            <DialogDescription className="text-left">
              Mot-clé: <span className="text-primary font-medium">{article.keyword_used}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {isSubscribed ? (
          <div className="space-y-4 mt-4">
            {hasContent ? (
              <>
                {article.question && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs font-medium text-primary mb-1">❓ Question</p>
                    <p className="text-foreground font-medium">{article.question}</p>
                  </div>
                )}
                {article.answer && (
                  <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                    <p className="text-xs font-medium text-secondary mb-1">✅ Réponse</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{article.answer}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Génération du Q&A en cours...
                    </p>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/30" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Q&A pas encore généré
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Cliquez sur "Générer" pour créer la question et réponse maintenant, ou attendez la génération automatique.
                      </p>
                    </div>
                    {onGenerate && (
                      <Button 
                        onClick={() => onGenerate(article.id)} 
                        className="gap-2"
                        disabled={generating}
                      >
                        <Sparkles className="w-4 h-4" />
                        Générer maintenant
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-6 bg-muted/50 rounded-lg text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">Contenu réservé aux abonnés</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Abonnez-vous au module SEO AutoPost pour accéder à ce contenu et débloquer toutes les fonctionnalités.
            </p>
            <Button onClick={() => onSubscribe(false)} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              S'abonner maintenant
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
