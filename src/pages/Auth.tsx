import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { AppLoadingBar } from "@/components/AppLoadingBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Check, ShieldCheck, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { isActivePaidPlan } from "@/lib/planEntitlements";
import { isAgentConsentReturn, oauthReturnPath } from "@/lib/oauth-return-path";

const Auth = () => {
  const { t, i18n } = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailMode, setEmailMode] = useState<"signin" | "signup" | "reset">("signin");
  const [signupSent, setSignupSent] = useState(false);
  const [signupErrorCode, setSignupErrorCode] = useState<string>();
  const isResetMode = emailMode === "reset";
  const isSignupMode = emailMode === "signup";
  const [resetStatus, setResetStatus] = useState<"sent" | "error" | null>(null);
  const isFrench = i18n.language?.startsWith("fr");

  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [gmbRequired, setGmbRequired] = useState(false);
  useEffect(() => {
    setGmbRequired(new URLSearchParams(window.location.search).get("gmb_required") === "1");
  }, []);

  // After auth: if ?redirect=checkout&priceKey=XXX → start Stripe checkout
  // Else respect ?next=/path, else go to onboarding/dashboard
  const checkSubscriptionAndRedirect = async (userId: string) => {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect");
    const priceKey = params.get("priceKey") || localStorage.getItem("pending_price_key");
    const nextParam = oauthReturnPath(params.get("next"));

    // Agent authorization is a separate flow from checkout and onboarding.
    // Google returns to /auth with the original query intact.
    if (isAgentConsentReturn(nextParam)) {
      window.location.replace(nextParam);
      return;
    }

    if ((redirectTo === "checkout" || localStorage.getItem("pending_price_key")) && priceKey) {
      localStorage.removeItem("pending_price_key");
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            priceKey,
            successUrl: `${window.location.origin}/payment-success?source=onboarding`,
            cancelUrl: `${window.location.origin}/onboarding?step=plan`,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      } catch (e) {
        console.error("[Auth] checkout redirect error:", e);
        toast({
          title: t("auth.errors.title"),
          description: t("auth.errors.checkoutFailed"),
          variant: "destructive",
        });
      }
    }

    const [{ data: profile }, { count: businessCount }] = await Promise.all([
      supabase.from("profiles")
        .select("onboarding_completed, free_plan_selected_at, plan_name, subscription_status, current_period_end, trial_end, google_refresh_token")
        .eq("id", userId).maybeSingle(),
      supabase.from("businesses").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_active", true),
    ]);
    // The first Google sign-in already requests business.manage permission.
    // If there are no managed locations yet, let onboarding discover them
    // using the stored refresh token. Never purge accounts for API failures.
    // A legacy onboarding_completed=true may reflect an abandoned checkout.
    const hasExplicitFreeChoice = Boolean(profile?.onboarding_completed && profile?.free_plan_selected_at);
    const hasVerifiedPaidPlan = isActivePaidPlan(profile);
    if ((!hasExplicitFreeChoice && !hasVerifiedPaidPlan) || (businessCount || 0) === 0) {
      navigate("/onboarding", { replace: true });
    } else if (nextParam !== "/") {
      navigate(nextParam, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    const hasTokens = hash.includes("access_token") || hash.includes("refresh_token");

    if (hasTokens) {
      setIsRedirecting(true);
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const providerRefreshToken = session.provider_refresh_token;
          if (providerRefreshToken && session.user) {
            try {
              const { error: saveError } = await supabase
                .from("profiles")
                .update({
                  google_refresh_token: providerRefreshToken,
                  google_access_token: null,
                  google_token_expires_at: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", session.user.id);
              if (saveError) console.error("[Auth] Unable to persist Google Business authorization:", saveError.message);
            } catch (err) {
              console.error("[Auth] Failed to store Google refresh token:", err);
            }
          }
          // Keep query string (redirect/priceKey) but clear hash
          window.history.replaceState(null, "", `/auth${window.location.search}`);
          await checkSubscriptionAndRedirect(session.user.id);
        }
      });
      return;
    }

    if (!authLoading && user) {
      setIsRedirecting(true);
      checkSubscriptionAndRedirect(user.id);
    }
  }, [user, authLoading, navigate]);

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: t("auth.errors.googleError"),
        description: error.message,
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handlePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isGoogleLoading || isPasswordLoading) return;

    const fields = new FormData(event.currentTarget);
    setIsPasswordLoading(true);
    setPasswordError(false);
    setResetStatus(null);
    setSignupSent(false);
    setSignupErrorCode(undefined);
    const email = String(fields.get("email") ?? "").trim();
    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: new URL("/reset-password", window.location.origin).href,
        });
        setResetStatus(error ? "error" : "sent");
        return;
      }
      const password = String(fields.get("password") ?? "");
      if (isSignupMode) {
        const { error } = await signUp(email, password, String(fields.get("fullName") ?? "").trim());
        setPasswordError(Boolean(error));
        setSignupErrorCode(error && "code" in error && typeof error.code === "string" ? error.code : undefined);
        setSignupSent(!error);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setPasswordError(Boolean(error));
    } catch {
      if (isResetMode) setResetStatus("error");
      else setPasswordError(true);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const signupErrorMessages: Record<string, [string, string]> = {
    signup_disabled: ["L’inscription par e-mail est désactivée.", "Email registration is disabled."],
    email_provider_disabled: ["L’inscription par e-mail est désactivée.", "Email registration is disabled."],
    weak_password: ["Choisissez un mot de passe plus robuste.", "Choose a stronger password."],
    email_address_invalid: ["Utilisez une adresse e-mail valide.", "Use a valid email address."],
    email_address_not_authorized: ["Le service d’envoi ne peut pas écrire à cette adresse.", "The email service cannot send to this address."],
    over_email_send_rate_limit: ["Trop d’e-mails envoyés. Réessayez plus tard.", "Too many emails sent. Try again later."],
    over_request_rate_limit: ["Trop de tentatives. Réessayez dans quelques instants.", "Too many attempts. Try again shortly."],
    unexpected_failure: ["Le service d’inscription a rencontré une erreur. Réessayez plus tard.", "The registration service encountered an error. Try again later."],
  };
  const signupErrorMessage = signupErrorCode ? signupErrorMessages[signupErrorCode]?.[isFrench ? 0 : 1] : undefined;

  const changeEmailMode = (mode: typeof emailMode) => {
    setEmailMode(mode);
    setPasswordError(false);
    setResetStatus(null);
    setSignupSent(false);
  };

  if (authLoading || isRedirecting) {
    return <AppLoadingBar message={t("auth.loading.connecting")} />;
  }
  if (user) {
    return <AppLoadingBar message={t("auth.loading.redirecting")} />;
  }

  const benefits = [
    t("auth.benefits.freeTrial"),
    t("auth.benefits.unlimitedResponses"),
    t("auth.benefits.gmbSync"),
    t("auth.benefits.prioritySupport"),
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row reviewai-wizard-bg">
      <Helmet>
        <title>{i18n.language?.startsWith("fr") ? "Connexion ou inscription | Reviews AI" : "Sign in or create your account | Reviews AI"}</title>
        <meta name="description" content="Access your Reviews AI account to manage AI review responses, local SEO and GEO ranking for your business." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://reviewsai.store/auth" />
      </Helmet>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[47%] reviewai-brand-gradient relative overflow-hidden p-12 flex-col justify-between">
        <div>
          <Link to="/">
            <RankiLogo showBadge={false} variant="mono" className="text-white" />
          </Link>
        </div>
        <div className="absolute w-[360px] h-[360px] rounded-full bg-white/5 -right-28 -top-20 pointer-events-none" />
        <div className="absolute w-[220px] h-[220px] rounded-full border border-white/15 -left-28 bottom-20 pointer-events-none" />
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-card mb-4">
              {t("auth.manageReviewsWithAI")}
            </h1>
            <p className="text-card/80 text-lg">{t("auth.joinBusinesses")}</p>
          </div>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-card">
                <div className="w-6 h-6 rounded-full bg-card/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-card/60 text-sm">
          © {new Date().getFullYear()} Reviews AI. {t("common.allRightsReserved")}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-transparent">
        <div className="lg:hidden p-3 sm:p-4 border-b border-border/60 bg-card">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
              <span>{t("auth.back")}</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="dropdown" />
              <RankiLogo showBadge={false} compactOnMobile />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex justify-end p-5">
          <LanguageSwitcher variant="dropdown" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-7 sm:px-8">
          <div className="w-full max-w-md reviewai-surface px-5 py-7 sm:p-9 space-y-6">
            <div className="hidden lg:block">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.backToHome")}
              </Link>
            </div>

            {gmbRequired && (
              <div role="alert" className="rounded-xl border-2 border-red-500 bg-red-50 p-5 text-red-950 shadow-lg dark:bg-red-950/40 dark:text-red-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-base font-extrabold">{i18n.language?.startsWith("fr") ? "Compte Google Business Profile requis" : "Google Business Profile account required"}</p>
                    <p className="mt-1.5 text-sm leading-6">{i18n.language?.startsWith("fr") ? "Ce compte ne possède aucune fiche Google Business Profile. Déconnectez-vous puis choisissez un autre compte Google pour continuer." : "This account has no Google Business Profile. Sign out and choose another Google account to continue."}</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t("auth.signInTitle")}
              </h2>
              <p className="text-muted-foreground mt-2">
                {t("auth.signInSubtitle")}
              </p>
            </div>

            <Button
              type="button"
              className="w-full h-12 rounded-xl text-base font-semibold reviewai-brand-gradient shadow-md shadow-primary/15 hover:brightness-105"
              onClick={handleGoogle}
              disabled={isGoogleLoading || isPasswordLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t("auth.continueWithGoogle")}
                </>
              )}
            </Button>

            <details open className="rounded-xl border border-border/60 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                {isFrench ? "Continuer avec un e-mail" : "Continue with email"}
              </summary>
              <form className="mt-3 space-y-3" onSubmit={handlePassword}>
                {isSignupMode && (
                  <label className="block space-y-1 text-sm">
                    <span>{isFrench ? "Nom complet" : "Full name"}</span>
                    <input className="w-full rounded-md border border-input bg-background px-3 py-2" name="fullName" autoComplete="name" required />
                  </label>
                )}
                <label className="block space-y-1 text-sm">
                  <span>{isFrench ? "Adresse e-mail" : "Email address"}</span>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                  />
                </label>
                {!isResetMode && (
                  <label className="block space-y-1 text-sm">
                    <span>{isFrench ? "Mot de passe" : "Password"}</span>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      name="password"
                      type="password"
                      key={emailMode}
                      autoComplete={isSignupMode ? "new-password" : "current-password"}
                      minLength={isSignupMode ? 6 : undefined}
                      required
                    />
                  </label>
                )}
                {resetStatus === "sent" && (
                  <p className="text-sm text-muted-foreground" role="status">
                    {isFrench
                      ? "Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation."
                      : "If an account matches this address, you’ll receive a password reset link."}
                  </p>
                )}
                {resetStatus === "error" && (
                  <p className="text-sm text-destructive" role="alert">
                    {isFrench ? "Envoi impossible. Réessayez dans quelques instants." : "Couldn’t send the link. Please try again shortly."}
                  </p>
                )}
                {signupSent && (
                  <p className="text-sm text-muted-foreground" role="status">
                    {isFrench ? "Vérifiez votre boîte mail pour confirmer votre inscription." : "Check your inbox to confirm your registration."}
                  </p>
                )}
                {passwordError && (
                  <p className="text-sm text-destructive" role="alert">
                    {isSignupMode
                      ? (signupErrorMessage ?? (isFrench ? "Inscription impossible. Réessayez dans quelques instants." : "Unable to sign up. Please try again shortly."))
                      : (isFrench ? "Connexion impossible. Vérifiez vos identifiants." : "Unable to sign in. Check your credentials.")}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isGoogleLoading || isPasswordLoading}>
                  {isPasswordLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isResetMode
                    ? (isFrench ? "Envoyer le lien" : "Send reset link")
                    : isSignupMode
                      ? (isFrench ? "Créer mon compte" : "Create account")
                      : (isFrench ? "Se connecter" : "Sign in")}
                </Button>
                <button
                  type="button"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  disabled={isGoogleLoading || isPasswordLoading}
                  onClick={() => changeEmailMode(emailMode === "signin" ? "reset" : "signin")}
                >
                  {emailMode !== "signin"
                    ? (isFrench ? "Retour à la connexion" : "Back to sign in")
                    : (isFrench ? "Mot de passe oublié ?" : "Forgot password?")}
                </button>
                {emailMode === "signin" && (
                  <button
                    type="button"
                    className="block text-sm text-primary underline-offset-4 hover:underline"
                    disabled={isGoogleLoading || isPasswordLoading}
                    onClick={() => changeEmailMode("signup")}
                  >
                    {isFrench ? "Créer un compte" : "Sign up"}
                  </button>
                )}
              </form>
            </details>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/10 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>
                {t("auth.stripeNotice")}
              </span>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t("auth.termsAgree")}{" "}
              <Link to="/terms" className="text-primary hover:underline">
                {t("auth.termsOfService")}
              </Link>{" "}
              {t("auth.and")}{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                {t("auth.privacyPolicy")}
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;