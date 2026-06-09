import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Lock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { BrandSparkle } from "@/components/BrandSparkle";

interface ArticlePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: {
    id: string;
    title: string | null;
    question: string | null;
    answer: string | null;
    content?: string | null;
    scheduled_date: string;
    status: string;
    keyword_used: string | null;
    content_type?: string;
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
  const { t, i18n } = useTranslation();
  if (!article) return null;

  const isQA = !!(article.question || article.answer);
  const isSEO = !!article.content;
  const hasContent = isQA || isSEO;
  const isGenerating = article.status === "generating" || generating;
  const isFr = (i18n.language || "fr").startsWith("fr");
  const dateLocale = isFr ? frLocale : enUS;
  const dateFmt = isFr ? "d MMM yyyy" : "MMM d, yyyy";

  const statusLabel =
    article.status === "published"
      ? t("articlePreview.statusPublished")
      : article.status === "generated"
      ? t("articlePreview.statusReady")
      : isGenerating
      ? t("articlePreview.statusGenerating")
      : t("articlePreview.statusScheduled");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={article.status === "published" ? "default" : article.status === "generated" ? "secondary" : "outline"}>
              {statusLabel}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(article.scheduled_date), dateFmt, { locale: dateLocale })}
            </span>
          </div>
          <DialogTitle className="text-left">
            {article.question || article.title || t("articlePreview.fallbackTitle")}
          </DialogTitle>
          {article.keyword_used && (
            <DialogDescription className="text-left">
              {t("articlePreview.keyword")}: <span className="text-primary font-medium">{article.keyword_used}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {isSubscribed ? (
          <div className="space-y-4 mt-4">
            {hasContent ? (
              <>
                {isQA && article.question && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1">{t("articlePreview.question")}</p>
                    <p className="text-foreground font-medium">{article.question}</p>
                  </div>
                )}
                {isQA && article.answer && (
                  <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                    <p className="text-xs font-semibold text-secondary mb-1">{t("articlePreview.answer")}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{article.answer}</p>
                  </div>
                )}
                {isSEO && article.content && (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-justify hyphens-auto
                      prose-headings:font-bold prose-headings:text-foreground prose-headings:text-left
                      prose-h2:mt-6 prose-h2:mb-2 prose-h2:text-xl
                      prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-lg
                      prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:mb-3
                      prose-a:text-primary prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">{t("articlePreview.generatingContent")}</p>
                  </>
                ) : (
                  <>
                    <BrandSparkle className="w-10 h-10 mx-auto text-muted-foreground/30" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">{t("articlePreview.notGenerated")}</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {t("articlePreview.notGeneratedDesc")}
                      </p>
                    </div>
                    {onGenerate && (
                      <Button onClick={() => onGenerate(article.id)} className="gap-2" disabled={generating}>
                        <BrandSparkle className="w-4 h-4" />
                        {t("articlePreview.generateNow")}
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
            <h3 className="font-semibold text-foreground mb-2">{t("articlePreview.upgradeTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("articlePreview.upgradeDesc")}
            </p>
            <Button onClick={() => onSubscribe(false)} className="gap-2">
              <BrandSparkle className="w-4 h-4" />
              {t("articlePreview.upgrade")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
