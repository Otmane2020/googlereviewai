import { useState, useEffect } from "react";
import { Switch } from "./ui/switch";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const AutoResponseToggle = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      const { data } = await supabase
        .from("ai_settings")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setEnabled(data.enabled ?? false);
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  const handleToggle = async (newValue: boolean) => {
    if (!user) return;
    setSaving(true);
    setEnabled(newValue);

    const { error } = await supabase
      .from("ai_settings")
      .upsert({
        user_id: user.id,
        enabled: newValue,
      });

    if (error) {
      setEnabled(!newValue);
      toast({
        title: "Error",
        description: "Unable to update the setting.",
        variant: "destructive",
      });
    } else {
      toast({
        title: newValue ? "Auto-réponse activée" : "Auto-réponse désactivée",
        description: newValue 
          ? "Les nouvelles réponses seront générées automatiquement."
          : "Vous devrez générer les réponses manuellement.",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors ${
      enabled 
        ? "bg-primary/5 border-primary/20" 
        : "bg-muted/50 border-border"
    }`}>
      <Sparkles className={`w-4 h-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-sm font-medium">Auto-réponse IA</span>
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={saving}
      />
    </div>
  );
};
