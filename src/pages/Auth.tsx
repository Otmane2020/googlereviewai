import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { AppLoadingBar } from "@/components/AppLoadingBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Check, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

const Auth = () => {
  const { t } = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const { signInWithGoogle, signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Helper function to check onboarding state and redirect
  const checkSubscriptionAndRedirect = async (userId: string) => {
    const nextParam = new URLSearchParams(window.location.search).get("next");
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

  // Handle OAuth callback and regular auth redirect
  // PAYMENT FIRST FLOW: Don't sync businesses here, just store tokens and redirect to payment
  useEffect(() => {
    // Check URL for OAuth callback tokens
    const hash = window.location.hash;
    const hasTokens = hash.includes('access_token') || hash.includes('refresh_token');
    
    if (hasTokens) {
      setIsRedirecting(true);
      // OAuth callback - store GMB refresh token but DON'T sync yet (payment first)
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          // If we have a provider_refresh_token from Google, store it for later GMB access
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
              console.log("[Auth] Stored Google refresh token for GMB access (will sync after payment)");
              
              // DON'T trigger business sync here - wait for payment first
              // The Dashboard will handle sync after subscription is verified
            } catch (err) {
              console.error("[Auth] Failed to store Google refresh token:", err);
            }
          }
          window.history.replaceState(null, '', '/auth');
          await checkSubscriptionAndRedirect(session.user.id);
        }
      });
      return;
    }
    
    // Regular auth check - redirect if already logged in
    if (!authLoading && user) {
      setIsRedirecting(true);
      checkSubscriptionAndRedirect(user.id);
    }
  }, [user, authLoading, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t("auth.errors.loginError"),
            description: error.message || t("auth.errors.invalidCredentials"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.success.loginSuccess"),
            description: t("auth.success.welcomeBack"),
          });
          // Redirect will be handled by the useEffect
        }
      } else {
        if (!fullName.trim()) {
          toast({
            title: t("auth.errors.nameRequired"),
            description: t("auth.errors.nameRequired"),
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: t("auth.errors.signupError"),
            description: error.message || t("auth.errors.cannotCreateAccount"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.success.signupSuccess"),
            description: t("auth.success.canNowLogin"),
          });
          setIsLogin(true);
          setEmail("");
          setPassword("");
          setFullName("");
        }
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("auth.errors.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show professional loading bar while checking authentication OR while redirecting
  if (authLoading || isRedirecting) {
    return <AppLoadingBar message={t("auth.loading.connecting")} />;
  }

  // If user is already logged in but not yet redirecting, show loader too
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
      {/* Left panel - Benefits (hidden on mobile) */}
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
            <p className="text-card/80 text-lg">
              {t("auth.joinBusinesses")}
            </p>
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
          © {new Date().getFullYear()} Ranki.ai. {t("common.allRightsReserved")}
        </p>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile header */}
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

        {/* Desktop language switcher */}
        <div className="hidden lg:flex justify-end p-4">
          <LanguageSwitcher variant="flags" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            {/* Desktop back button */}
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
                {isLogin ? t("auth.signIn") : t("auth.signUp")}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isLogin 
                  ? t("auth.connectToAccess")
                  : t("auth.createAccountToStart")}
              </p>
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
              onClick={async () => {
                setIsGoogleLoading(true);
                const { error } = await signInWithGoogle();
                if (error) {
                  toast({
                    title: t("auth.errors.googleError"),
                    description: error.message,
                    variant: "destructive",
                  });
                }
                setIsGoogleLoading(false);
              }}
              disabled={isGoogleLoading || loading}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t("auth.continueWithGoogle")}
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("auth.orContinueWith")}
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t("auth.fullNamePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={loading || isGoogleLoading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isLogin ? t("auth.signInButton") : t("auth.signUpButton")
                )}
              </Button>
            </form>

            {/* Toggle login/signup */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setFullName("");
                }}
                className="text-sm text-primary hover:underline"
              >
                {isLogin 
                  ? t("auth.noAccount")
                  : t("auth.hasAccount")}
              </button>
              
              {isLogin && (
                <div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t("auth.termsAgree")}{" "}
              <Link to="/terms" className="text-primary hover:underline">
                {t("auth.termsOfService")}
              </Link>{" "}
              {t("auth.and")}{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                {t("auth.privacyPolicy")}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
