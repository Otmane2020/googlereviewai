import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const OAuthCallback = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for custom OAuth code (from our own Google OAuth flow)
    const oauthCode = searchParams.get('code');
    const oauthState = searchParams.get('state'); // Contains user_id
    
    // Handle custom OAuth callback
    if (oauthCode && !isProcessing) {
      setIsProcessing(true);
      
      // Get user_id from state or session storage
      const userId = oauthState || sessionStorage.getItem("google_oauth_user_id");
      
      if (userId) {
        // Exchange code for tokens via edge function
        supabase.functions.invoke("google-oauth-callback", {
          body: { 
            code: oauthCode,
            user_id: userId 
          }
        }).then(({ data, error }) => {
          // Clear URL params
          window.history.replaceState(null, '', pathname);
          sessionStorage.removeItem("google_oauth_user_id");
          
          if (error || !data?.success) {
            console.error("OAuth callback error:", error || data?.error);
            toast({
              title: "Erreur de connexion",
              description: data?.error || "Échec de la connexion Google Business.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Connecté",
              description: "Votre compte Google Business est connecté pour la synchronisation automatique.",
            });
            
            // Notify parent window (if opened via window.open) that OAuth succeeded
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: "GOOGLE_OAUTH_SUCCESS" }, "*");
              // Close this popup window after notifying parent
              window.close();
              return;
            }
          }
          
          setIsProcessing(false);
          navigate("/dashboard", { replace: true });
        }).catch((err) => {
          console.error("OAuth callback exception:", err);
          setIsProcessing(false);
          window.history.replaceState(null, '', pathname);
          navigate("/dashboard", { replace: true });
        });
        
        return;
      }
    }
    
    // Handle Lovable/Supabase OAuth tokens (existing flow)
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('type');
    
    // Skip if this is a password recovery token
    if (tokenType === 'recovery') {
      return;
    }
    
    // If we're on reset-password page, don't redirect
    if (pathname === '/reset-password') {
      if (accessToken) {
        window.history.replaceState(null, '', pathname);
      }
      return;
    }
    
    if (accessToken && !isProcessing) {
      setIsProcessing(true);
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        window.history.replaceState(null, '', window.location.pathname);
        
        if (session) {
          navigate("/dashboard", { replace: true });
        }
        setIsProcessing(false);
      }).catch(() => {
        setIsProcessing(false);
      });
    }
  }, [location, navigate, isProcessing, user]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Google sign-in in progress...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
