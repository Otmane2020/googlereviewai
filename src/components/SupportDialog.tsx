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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, Send, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const issueTypes = [
  { value: "bug", label: "🐛 Bug / Problème technique" },
  { value: "sync", label: "🔄 Synchronisation Google" },
  { value: "billing", label: "💳 Facturation / Abonnement" },
  { value: "feature", label: "💡 Suggestion de fonctionnalité" },
  { value: "account", label: "👤 Problème de compte" },
  { value: "other", label: "❓ Autre" },
];

interface SupportDialogProps {
  userEmail?: string;
  triggerClassName?: string;
}

export const SupportDialog = ({ userEmail, triggerClassName }: SupportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !issueType) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Send support email via edge function
      const { error } = await supabase.functions.invoke("send-support-email", {
        body: {
          email: userEmail,
          title: title.trim(),
          description: description.trim(),
          issueType,
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Message envoyé !",
        description: "Notre équipe vous répondra dans les plus brefs délais.",
      });

      // Reset after 2s and close
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setTitle("");
        setDescription("");
        setIssueType("");
      }, 2000);
    } catch (error) {
      console.error("Error sending support request:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <HelpCircle className="w-4 h-4 mr-2" />
          Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Contacter le support
          </DialogTitle>
          <DialogDescription>
            Décrivez votre problème ou question et nous vous répondrons rapidement.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Message envoyé !</h3>
            <p className="text-sm text-muted-foreground">
              Nous vous répondrons par email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueType">Type de demande</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                placeholder="Résumez votre demande..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez le problème en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
