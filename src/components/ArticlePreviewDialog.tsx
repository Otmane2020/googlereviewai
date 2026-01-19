import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Lock, ExternalLink, Sparkles } from "lucide-react";
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
  onSubscribe: () => void;
}

export const ArticlePreviewDialog = ({
  open,
  onOpenChange,
  article,
  isSubscribed,
  onSubscribe,
}: ArticlePreviewDialogProps) => {
  if (!article) return null;

  const hasContent = article.question || article.answer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={article.status === "published" ? "default" : "secondary"}>
              {article.status === "published" ? "Publié" : article.status === "generated" ? "Prêt" : "Planifié"}
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
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Question</p>
                    <p className="text-foreground">{article.question}</p>
                  </div>
                )}
                {article.answer && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Réponse</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{article.answer}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Le contenu sera généré automatiquement à la date planifiée.
                </p>
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
            <Button onClick={onSubscribe} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              S'abonner maintenant
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
