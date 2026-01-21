import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { AppLoadingBar } from "@/components/AppLoadingBar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Check } from "lucide-react";

const Auth = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  // Helper function to check subscription and redirect accordingly
  const checkSubscriptionAndRedirect = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_name, subscription_status")
        .eq("id", userId)
        .maybeSingle();
      
      const validStatuses = ["active", "trial", "trialing"];
      const hasValidPlan = profile?.plan_name && 
        profile.plan_name !== "free" &&
        validStatuses.includes(profile.subscription_status || "");
      
      if (hasValidPlan) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/select-plan", { replace: true });
      }
    } catch (error) {
      console.error("[Auth] Error checking subscription:", error);
      navigate("/select-plan", { replace: true });
    }
  };

  // Handle OAuth callback and regular auth redirect
  useEffect(() => {
    // Check URL for OAuth callback tokens
    const hash = window.location.hash;
    const hasTokens = hash.includes('access_token') || hash.includes('refresh_token');
    
    if (hasTokens) {
      setIsRedirecting(true);
      // OAuth callback - let Supabase process tokens, then store GMB refresh token
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          // If we have a provider_refresh_token from Google, store it for GMB access
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
              console.log("[Auth] Stored Google refresh token for GMB access");
              
              // Immediately trigger business sync with fresh provider_token
              if (session.provider_token) {
                console.log("[Auth] Triggering immediate business sync...");
                try {
                  const syncResponse = await supabase.functions.invoke("sync-google-businesses", {
                    body: { provider_token: session.provider_token },
                  });
                  
                  if (syncResponse.data?.requires_selection) {
                    sessionStorage.setItem("pending_business_selection", JSON.stringify({
                      businesses: syncResponse.data.google_businesses,
                      maxBusinesses: syncResponse.data.max_businesses,
                    }));
                    console.log("[Auth] Stored pending business selection for Dashboard");
                  } else if (syncResponse.data?.success) {
                    localStorage.setItem(`starlinko_initial_sync_${session.user.id}`, "true");
                    console.log("[Auth] Business sync complete, no selection needed");
                  }
                } catch (syncErr) {
                  console.error("[Auth] Business sync failed:", syncErr);
                }
              }
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
    if (!loading && user) {
      setIsRedirecting(true);
      checkSubscriptionAndRedirect(user.id);
    }
  }, [user, loading, navigate]);

  // Show professional loading bar while checking authentication OR while redirecting
  if (loading || isRedirecting) {
    return <AppLoadingBar message="Connexion en cours..." />;
  }

  // If user is already logged in but not yet redirecting, show loader too
  if (user) {
    return <AppLoadingBar message="Redirection..." />;
  }

  const benefits = [
    "3 jours d'essai gratuit",
    "Réponses IA illimitées",
    "Synchronisation Google My Business",
    "Support prioritaire",
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - Benefits (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col justify-between">
        <div>
          <Link to="/">
            <StarlinkoLogo showBadge={false} className="text-card" />
          </Link>
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-card mb-4">
              Gérez vos avis Google avec l'IA
            </h1>
            <p className="text-card/80 text-lg">
              Rejoignez des centaines d'entreprises qui automatisent leurs réponses aux avis.
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
          © {new Date().getFullYear()} Starlinko. Tous droits réservés.
        </p>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile header */}
        <div className="lg:hidden p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            <StarlinkoLogo showBadge={false} />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            {/* Desktop back button */}
            <div className="hidden lg:block">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Connexion
              </h2>
              <p className="text-muted-foreground mt-2">
                Connectez-vous avec votre compte Google pour accéder à vos établissements
              </p>
            </div>

            {/* Google OAuth Only */}
            <div className="space-y-5">
              <Button
                type="button"
                className="w-full h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                onClick={async () => {
                  setIsGoogleLoading(true);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    toast({
                      title: "Erreur Google",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                  setIsGoogleLoading(false);
                }}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
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
                    Continuer avec Google
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Nous utilisons votre compte Google pour synchroniser vos établissements Google My Business.
              </p>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              En continuant, vous acceptez nos{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Conditions d'utilisation
              </Link>{" "}
              et notre{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Politique de confidentialité
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
