import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Sparkles, Copy, Send, Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: number;
  review_id: string;
  author: string;
  rating: number;
  comment: string;
  review_date: string;
  ai_response: string | null;
}

interface ResponsePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  onPublish: (reviewId: number) => Promise<void>;
  publishingId: number | null;
}

export const ResponsePreviewDialog = ({
  open,
  onOpenChange,
  review,
  onPublish,
  publishingId,
}: ResponsePreviewDialogProps) => {
  const [editedResponse, setEditedResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edited response when dialog opens
  useEffect(() => {
    if (review?.ai_response) {
      setEditedResponse(review.ai_response);
      setHasChanges(false);
    }
  }, [review?.ai_response, open]);

  const handleTextChange = (value: string) => {
    setEditedResponse(value);
    setHasChanges(value !== review?.ai_response);
  };

  const handleSave = async () => {
    if (!review) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ ai_response: editedResponse })
        .eq("id", review.id);

      if (error) throw error;

      setHasChanges(false);
      toast({ title: "Réponse sauvegardée" });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la réponse.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!review) return;
    
    // Save first if there are changes
    if (hasChanges) {
      await handleSave();
    }
    
    await onPublish(review.id);
    onOpenChange(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedResponse);
    toast({ title: "Copié !" });
  };

  if (!review) return null;

  const isPublishing = publishingId === review.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Aperçu de la réponse
          </DialogTitle>
          <DialogDescription>
            Modifiez la réponse si nécessaire avant de la publier sur Google.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Rating section */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {review.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{review.author}</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < review.rating
                        ? "text-accent fill-accent"
                        : "text-muted-foreground/20"
                    }`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {new Date(review.review_date).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </div>

          {/* Client comment */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Avis client :
            </p>
            <p className="text-sm text-foreground">
              {review.comment || "Aucun commentaire"}
            </p>
          </div>

          {/* Editable AI Response */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <Sparkles className="w-3 h-3" /> AI response
              </div>
              {hasChanges && (
                <span className="text-xs text-muted-foreground">
                  Modifications non sauvegardées
                </span>
              )}
            </div>
            <Textarea
              value={editedResponse}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-[150px] resize-none text-sm"
              placeholder="Response..."
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={copyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" /> Copier
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
            <Button
              size="default"
              className="w-full"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Publier sur Google
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
