import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const OAuthCallback = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    // Only process if we have actual OAuth tokens in the hash
    // Must contain access_token with a value, not just empty hash or fragment
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('type');
    
    // Skip if this is a password recovery token - let ResetPassword handle it
    if (tokenType === 'recovery') {
      return;
    }
    
    // If we're on reset-password page, don't redirect to dashboard
    if (pathname === '/reset-password') {
      // Just clean the URL, don't redirect
      if (accessToken) {
        window.history.replaceState(null, '', pathname);
      }
      return;
    }
    
    if (accessToken && !isProcessing) {
      setIsProcessing(true);
      
      // Let Supabase process the tokens
      supabase.auth.getSession().then(({ data: { session } }) => {
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        if (session) {
          // Redirect to dashboard after successful OAuth
          navigate("/dashboard", { replace: true });
        }
        setIsProcessing(false);
      }).catch(() => {
        setIsProcessing(false);
      });
    }
  }, [location, navigate, isProcessing]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connexion en cours...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};