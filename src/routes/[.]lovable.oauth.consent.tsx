import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { supabase } from "@/integrations/supabase/client";
import { agentConsentPath } from "@/lib/oauth-return-path";

const title = "Autoriser un assistant | ReviewsAI";
const description = "Acceptez ou refusez l’accès en lecture seule d’un assistant à vos établissements ReviewsAI.";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id: typeof search.authorization_id === "string" ? search.authorization_id : "",
  }),
  head: () => ({ meta: [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: ConsentPage,
  errorComponent: () => <ConsentShell><p role="alert">Cette demande n’a pas pu être ouverte. / Could not open this request.</p></ConsentShell>,
});

function ConsentShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="reviewai-wizard-bg min-h-screen grid place-items-center px-4 py-8">
      <section className="reviewai-surface w-full max-w-lg space-y-5 p-6 sm:p-8 [overflow-wrap:anywhere]">
        <RankiLogo showBadge={false} />
        {children}
      </section>
    </main>
  );
}

function ConsentPage() {
  const { authorization_id } = Route.useSearch();
  return <ConsentRequest key={authorization_id} authorizationId={authorization_id} />;
}

function ConsentRequest({ authorizationId }: { authorizationId: string }) {
  const { i18n } = useTranslation();
  const en = (i18n.resolvedLanguage || i18n.language)?.startsWith("en");
  const t = (fr: string, english: string) => en ? english : fr;
  const [details, setDetails] = useState<OAuthAuthorizationDetails>();
  const [problem, setProblem] = useState<"request" | "approve" | "deny">();
  const [busy, setBusy] = useState(false);
  const deciding = useRef(false);

  useEffect(() => {
    if (!authorizationId) return;
    let live = true;
    async function load() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!live) return;
        if (error) throw error;
        if (!data.session) {
          const next = agentConsentPath + window.location.search + window.location.hash;
          window.location.replace(`/auth?${new URLSearchParams({ next })}`);
          return;
        }
        const response = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
        if (!live) return;
        if (response.error || !response.data) throw response.error ?? new Error("Missing authorization details");
        if ("redirect_url" in response.data) {
          window.location.replace(response.data.redirect_url);
        } else {
          setDetails(response.data);
        }
      } catch {
        if (live) setProblem("request");
      }
    }
    void load();
    return () => { live = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    if (!details || deciding.current) return;
    deciding.current = true;
    setBusy(true);
    setProblem(undefined);
    try {
      const { data, error } = approve
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId);
      if (error || !data?.redirect_url) throw error ?? new Error("Missing redirect");
      window.location.replace(data.redirect_url);
    } catch {
      deciding.current = false;
      setBusy(false);
      setProblem(approve ? "approve" : "deny");
    }
  }

  if (!authorizationId || problem === "request") {
    return <ConsentShell>
      <h1 className="text-xl font-semibold">{t("Connexion indisponible", "Connection unavailable")}</h1>
      <p role="alert">{t("Cette demande est invalide, a expiré ou n’a pas pu être chargée. Relancez la connexion depuis votre assistant.", "This request is invalid, has expired, or could not be loaded. Start the connection again from your assistant.")}</p>
    </ConsentShell>;
  }
  if (!details) return <ConsentShell><p role="status">{t("Vérification de la demande…", "Checking the request…")}</p></ConsentShell>;

  const client = details.client.name || t("votre assistant", "your assistant");
  const scopes = details.scope.split(/\s+/).filter(Boolean);
  const scopeLabel = (scope: string) => {
    switch (scope) {
      case "openid": return t("Confirmer votre identité", "Confirm your identity");
      case "profile": return t("Partager votre profil de base", "Share your basic profile");
      case "email": return t("Partager votre adresse e-mail", "Share your email address");
      default: return t(`Autorisation supplémentaire : ${scope}`, `Additional permission: ${scope}`);
    }
  };

  return <ConsentShell>
    <h1 className="text-xl font-semibold">{t(`Connecter ${client} à ReviewsAI`, `Connect ${client} to ReviewsAI`)}</h1>
    <dl className="space-y-2 text-sm text-muted-foreground">
      <div><dt>{t("Compte connecté", "Signed-in account")}</dt><dd className="text-foreground">{details.user.email}</dd></div>
      <div><dt>{t("Adresse de retour", "Callback address")}</dt><dd className="text-foreground">{details.redirect_uri}</dd></div>
    </dl>
    <p>{t("L’assistant pourra consulter vos établissements actifs (nom, adresse, note et nombre d’avis), sans rien modifier ni publier. Les droits de votre compte restent inchangés.", "The assistant can read your active businesses (name, address, rating, and review count) without editing or publishing anything. Your account permissions still apply.")}</p>
    {scopes.length > 0 && <ul className="list-disc pl-5 text-sm text-muted-foreground">{scopes.map(scope => <li key={scope}>{scopeLabel(scope)}</li>)}</ul>}
    {problem && <p role="alert" className="text-destructive">{problem === "approve"
      ? t("L’autorisation a échoué. Réessayez.", "Approval failed. Try again.")
      : t("Le refus n’a pas pu être enregistré. Réessayez.", "Denial could not be saved. Try again.")}</p>}
    <div className="flex flex-wrap gap-3" aria-busy={busy}>
      <Button disabled={busy} onClick={() => void decide(true)}>{t("Autoriser", "Approve")}</Button>
      <Button variant="outline" disabled={busy} onClick={() => void decide(false)}>{t("Refuser", "Deny")}</Button>
    </div>
  </ConsentShell>;
}
