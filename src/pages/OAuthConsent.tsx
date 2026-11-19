import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Details = {
  authorization_id: string;
  redirect_uri: string;
  scope: string;
  client: { client_id: string; client_name?: string; client_uri?: string; logo_uri?: string };
  user: { id: string; email: string };
};

const PERMISSIONS = [
  "Lire vos établissements Google et leurs avis",
  "Générer des brouillons de réponse IA (utilise vos crédits ReviewsAI)",
  "Publier une réponse sur Google quand vous le demandez",
  "Consulter vos statistiques Google Business et votre classement Maps",
];

/**
 * Consent screen for the Supabase OAuth 2.1 server (authorization path
 * /oauth/consent). Used when Claude, ChatGPT or another MCP client connects
 * to https://reviewsai.store/mcp.
 */
export default function OAuthConsent() {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const authorizationId =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("authorization_id") : null;

  useEffect(() => {
    if (!authorizationId) {
      setError("Requête d'autorisation invalide (authorization_id manquant).");
      return;
    }
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const next = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
        window.location.replace(`/auth?next=${encodeURIComponent(next)}`);
        return;
      }
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (error || !data) {
        setError(error?.message ?? "Cette demande d'autorisation a expiré. Relancez la connexion depuis votre assistant.");
        return;
      }
      if (!("authorization_id" in data)) {
        // Already approved earlier: Supabase gives us the client callback directly.
        window.location.replace((data as { redirect_url: string }).redirect_url);
        return;
      }
      setDetails(data as unknown as Details);
    })();
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    if (!authorizationId) return;
    setBusy(true);
    const fn = approve ? supabase.auth.oauth.approveAuthorization : supabase.auth.oauth.denyAuthorization;
    const { data, error } = await fn.call(supabase.auth.oauth, authorizationId, { skipBrowserRedirect: true });
    if (error || !data?.redirect_url) {
      setBusy(false);
      setError(error?.message ?? "Impossible de finaliser l'autorisation.");
      return;
    }
    window.location.replace(data.redirect_url);
  };

  const clientName = details?.client.client_name || "Une application";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Autoriser l'accès | ReviewsAI</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="w-full max-w-md">
        {error ? (
          <CardHeader>
            <CardTitle>Autorisation impossible</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        ) : !details ? (
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center">
              {details.client.logo_uri ? (
                <img src={details.client.logo_uri} alt="" className="mx-auto mb-3 h-12 w-12 rounded-lg" />
              ) : (
                <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-primary" />
              )}
              <CardTitle>{clientName} souhaite accéder à votre compte ReviewsAI</CardTitle>
              <CardDescription>Connecté en tant que {details.user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm font-medium">Cette application pourra :</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {PERMISSIONS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {details.client.client_uri && (
                <p className="mt-4 text-xs text-muted-foreground break-all">
                  Application : {details.client.client_uri}
                  <br />
                  Redirection : {details.redirect_uri}
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Vous pourrez révoquer cet accès à tout moment depuis les paramètres de l'assistant ou en nous écrivant à
                support@reviewsai.store.
              </p>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                Refuser
              </Button>
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autoriser"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
