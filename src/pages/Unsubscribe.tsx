import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, MailX, XCircle } from "lucide-react";

type State = "loading" | "valid" | "already" | "invalid" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return setState("invalid");
        if (data?.used || data?.already_unsubscribed) return setState("already");
        setState("valid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setSubmitting(false);
    setState(error ? "error" : "done");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md p-8 rounded-3xl text-center space-y-4">
        {state === "loading" && <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />}

        {state === "valid" && (
          <>
            <MailX className="w-10 h-10 mx-auto text-amber-500" />
            <h1 className="text-xl font-bold">Se désabonner des emails</h1>
            <p className="text-sm text-muted-foreground">
              Vous ne recevrez plus d'emails de GoogleReviewAI (hors emails de sécurité et de compte).
            </p>
            <Button className="w-full" onClick={confirm} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer le désabonnement"}
            </Button>
          </>
        )}

        {state === "done" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            <h1 className="text-xl font-bold">Désabonnement confirmé</h1>
            <p className="text-sm text-muted-foreground">Vous ne recevrez plus nos emails.</p>
          </>
        )}

        {state === "already" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            <h1 className="text-xl font-bold">Déjà désabonné</h1>
            <p className="text-sm text-muted-foreground">Cette adresse est déjà désinscrite.</p>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive" />
            <h1 className="text-xl font-bold">Lien invalide</h1>
            <p className="text-sm text-muted-foreground">
              Ce lien de désabonnement est invalide ou a expiré.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
