import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { supabase } from "@/integrations/supabase/client";
import { agentConsentPath } from "@/lib/oauth-return-path";
import { classifyConsentError } from "@/lib/oauth-consent-error";

const title = "Autoriser un assistant | ReviewsAI";
const description = "Acceptez ou refusez l’accès d’un assistant à vos établissements et avis ReviewsAI.";

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
  const [problem, setProblem] = useState<"request" | "expired" | "approve" | "deny">();
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
      } catch (error) {
        console.warn("[oauth-consent] load failed", error);
        if (live) setProblem(classifyConsentError(error) === "expired" ? "expired" : "request");
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
    } catch (error) {
      console.warn("[oauth-consent] decision failed", error);
      const kind = classifyConsentError(error);
      deciding.current = false;
      setBusy(false);
      if (kind === "session") {
        const next = agentConsentPath + window.location.search + window.location.hash;
        window.location.replace(`/auth?${new URLSearchParams({ next })}`);
        return;
      }
      setProblem(kind === "expired" ? "expired" : approve ? "approve" : "deny");
    }
  }

  if (problem === "expired") {
    return <ConsentShell>
      <h1 className="text-xl font-semibold">{t("Demande expirée", "Request expired")}</h1>
      <p role="alert">{t("Cette demande de connexion a expiré ou a déjà été utilisée. Retournez dans votre assistant (Claude ou ChatGPT) et cliquez à nouveau sur « Se connecter » : une nouvelle demande s’ouvrira ici.", "This connection request has expired or was already used. Go back to your assistant (Claude or ChatGPT) and click “Connect” again: a new request will open here.")}</p>
    </ConsentShell>;
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
    <p>{t("L’assistant pourra :", "The assistant will be able to:")}</p>
    <ul className="list-disc pl-5 text-sm">
      <li>{t("lire vos établissements actifs et leurs avis Google", "read your active businesses and their Google reviews")}</li>
      <li>{t("générer des brouillons de réponse IA (utilise vos crédits ReviewsAI)", "draft AI replies (uses your ReviewsAI credits)")}</li>
      <li>{t("publier une réponse sur Google lorsque vous le demandez", "publish a reply on Google when you ask it to")}</li>
      <li>{t("consulter vos statistiques Google Business et votre classement Maps", "view your Google Business stats and Maps ranking")}</li>
    </ul>
    <p className="text-sm text-muted-foreground">{t("Les droits de votre compte restent inchangés. Vous pouvez révoquer l’accès à tout moment depuis votre assistant.", "Your account permissions still apply. You can revoke access at any time from your assistant.")}</p>
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
