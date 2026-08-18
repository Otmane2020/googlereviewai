import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { AppLoadingBar } from "@/components/AppLoadingBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Check, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

const Auth = () => {
  const { t } = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // After auth: if ?redirect=checkout&priceKey=XXX → start Stripe checkout
  // Else respect ?next=/path, else go to onboarding/dashboard
  const checkSubscriptionAndRedirect = async (userId: string) => {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect");
    const priceKey = params.get("priceKey");
    const nextParam = params.get("next");

    if (redirectTo === "checkout" && priceKey) {
      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            priceKey,
            successUrl: `${window.location.origin}/dashboard?success=true`,
            cancelUrl: `${window.location.origin}/?canceled=true`,
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

    if (nextParam && nextParam.startsWith("/")) {
      navigate(nextParam, { replace: true });
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.onboarding_completed) {
      navigate("/onboarding", { replace: true });
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
              await supabase
                .from("profiles")
                .update({
                  google_refresh_token: providerRefreshToken,
                  google_access_token: null,
                  google_token_expires_at: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", session.user.id);
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Helmet>
        <title>Sign in or create your account | GoogleReviewAI</title>
        <meta name="description" content="Access your GoogleReviewAI account to manage AI review responses, local SEO and GEO ranking for your business." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://googlereviewai.com/auth" />
      </Helmet>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col justify-between">
        <div>
          <Link to="/">
            <RankiLogo showBadge={false} className="text-card" />
          </Link>
        </div>
        <div className="space-y-8">
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
          © {new Date().getFullYear()} GoogleReviewAI. {t("common.allRightsReserved")}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="lg:hidden p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
              <span>{t("auth.back")}</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="flags" />
              <RankiLogo showBadge={false} />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex justify-end p-4">
          <LanguageSwitcher variant="flags" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="hidden lg:block">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.backToHome")}
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Connectez-vous à GoogleReviewAI
              </h2>
              <p className="text-muted-foreground mt-2">
                Connexion sécurisée avec votre compte Google — nécessaire pour synchroniser votre fiche Google Business Profile.
              </p>
            </div>

            <Button
              type="button"
              className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
              onClick={handleGoogle}
              disabled={isGoogleLoading}
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

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
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
