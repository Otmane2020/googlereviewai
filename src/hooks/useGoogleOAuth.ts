import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface OAuthStatus {
  isConnected: boolean;
  requiresReconnect: boolean;
}

export const useGoogleOAuth = () => {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const initiateOAuth = useCallback(async () => {
    if (!user) {
      toast({
        title: "Non connecté",
        description: "Veuillez vous connecter d'abord.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Get OAuth URL from backend - redirect_uri is determined server-side
      const { data, error } = await supabase.functions.invoke("get-google-oauth-url", {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.auth_url) {
        // Store user_id in session storage for callback
        sessionStorage.setItem("google_oauth_user_id", user.id);
        // Open in new window to avoid iframe/webview restrictions from Google
        window.open(data.auth_url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error(data?.error || "Failed to get OAuth URL");
      }
    } catch (error) {
      console.error("OAuth initiation error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'initier la connexion Google.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  }, [user]);

  const handleOAuthCallback = useCallback(async (code: string): Promise<boolean> => {
    if (!user) return false;

    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke("google-oauth-callback", {
        body: { 
          code,
          user_id: user.id 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Connexion réussie",
          description: "Votre compte Google Business est maintenant connecté.",
        });
        return true;
      } else {
        throw new Error(data?.error || "OAuth callback failed");
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Échec de la connexion Google.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [user]);

  const checkOAuthStatus = useCallback(async (): Promise<OAuthStatus> => {
    if (!user) {
      return { isConnected: false, requiresReconnect: false };
    }

    setIsCheckingStatus(true);

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("google_refresh_token")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const isConnected = !!profile?.google_refresh_token;

      return {
        isConnected,
        requiresReconnect: !isConnected,
      };
    } catch (error) {
      console.error("Error checking OAuth status:", error);
      return { isConnected: false, requiresReconnect: true };
    } finally {
      setIsCheckingStatus(false);
    }
  }, [user]);

  return {
    initiateOAuth,
    handleOAuthCallback,
    checkOAuthStatus,
    isConnecting,
    isCheckingStatus,
  };
};
