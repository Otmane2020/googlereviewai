import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddTestReviewDialogProps {
  userId: string;
  onReviewAdded: () => void;
}

export const AddTestReviewDialog = ({ userId, onReviewAdded }: AddTestReviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'auteur est requis.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: userId,
        author: author.trim(),
        rating,
        comment: comment.trim() || null,
        review_id: `test_${Date.now()}`,
        location_id: "test_location",
        review_date: new Date().toISOString(),
        replied: false,
      });

      if (error) throw error;

      toast({
        title: "Avis ajouté !",
        description: "L'avis de test a été créé avec succès.",
      });

      setAuthor("");
      setRating(5);
      setComment("");
      setOpen(false);
      onReviewAdded();
    } catch (error) {
      console.error("Error adding test review:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'avis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un avis test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            Ajouter un avis de test
          </DialogTitle>
          <DialogDescription>
            Créez un avis fictif pour tester la génération de réponses IA.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author">Nom du client</Label>
            <Input
              id="author"
              placeholder="Jean Dupont"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "text-accent fill-accent"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire</Label>
            <Textarea
              id="comment"
              placeholder="Super service, je recommande !"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter l'avis"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
