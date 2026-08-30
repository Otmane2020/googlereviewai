import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { HelpCircle, Send, Loader2, CheckCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SUPPORT_PHONE = "01 85 09 91 15";

const ISSUE_KEYS = ["bug", "sync", "billing", "feature", "account", "other"] as const;

interface SupportDialogProps {
  userEmail?: string;
  triggerClassName?: string;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SupportDialog = ({ userEmail, triggerClassName, hideTrigger, open: openProp, onOpenChange }: SupportDialogProps) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !issueType) {
      toast({
        title: t("supportDialog.requiredTitle"),
        description: t("supportDialog.requiredDesc"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-support-email", {
        body: {
          email: userEmail,
          title: title.trim(),
          description: description.trim(),
          issueType,
        },
      });

      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      setSubmitted(true);
      toast({
        title: t("supportDialog.successTitle"),
        description: t("supportDialog.successDesc"),
      });

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
        title: t("supportDialog.errorTitle"),
        description: t("supportDialog.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className={triggerClassName}>
            <HelpCircle className="w-4 h-4 mr-2" />
            {t("supportDialog.trigger")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            {t("supportDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("supportDialog.description")}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
            <Phone className="w-4 h-4 text-primary" />
            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="text-sm font-medium text-primary hover:underline">
              {SUPPORT_PHONE}
            </a>
          </div>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{t("supportDialog.sent")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("supportDialog.sentDesc")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueType">{t("supportDialog.type")}</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder={t("supportDialog.typePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`supportDialog.types.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t("supportDialog.titleLabel")}</Label>
              <Input
                id="title"
                placeholder={t("supportDialog.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("supportDialog.descLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("supportDialog.descPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("supportDialog.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {t("supportDialog.send")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
