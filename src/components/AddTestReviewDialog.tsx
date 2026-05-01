import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Plus, TestTube, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BusinessOption {
  id: string;
  name: string;
  google_place_id: string | null;
}

interface AddTestReviewDialogProps {
  userId: string;
  businesses?: BusinessOption[];
  defaultLocationId?: string;
  onReviewAdded: () => void;
}

export const AddTestReviewDialog = ({
  userId,
  businesses = [],
  defaultLocationId,
  onReviewAdded,
}: AddTestReviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [locationId, setLocationId] = useState<string>("test_location");

  const businessOptions = useMemo(
    () => businesses.filter((b) => !!b.google_place_id) as Array<Required<BusinessOption>>,
    [businesses]
  );

  useEffect(() => {
    if (!open) return;

    // If user is currently filtering a location, preselect it
    if (defaultLocationId && defaultLocationId !== "all") {
      setLocationId(defaultLocationId);
      return;
    }

    setLocationId("test_location");
  }, [open, defaultLocationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim()) {
      toast({
        title: "Error",
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
        location_id: locationId,
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
        title: "Error",
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
          {businessOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Établissement</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un établissement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test_location">Avis de test (global)</SelectItem>
                  {businessOptions.map((b) => (
                    <SelectItem key={b.id} value={b.google_place_id!}>
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {b.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
