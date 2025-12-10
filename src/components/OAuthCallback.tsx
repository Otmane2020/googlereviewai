import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const OAuthCallback = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const hasTokens = hash.includes('access_token') || hash.includes('refresh_token');
    
    if (hasTokens && !isProcessing) {
      setIsProcessing(true);
      
      // Let Supabase process the tokens
      supabase.auth.getSession().then(({ data: { session } }) => {
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        if (session) {
          // Redirect to dashboard after successful OAuth
          navigate("/dashboard", { replace: true });
        } else {
          setIsProcessing(false);
        }
      });
    }
  }, [navigate, isProcessing]);

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