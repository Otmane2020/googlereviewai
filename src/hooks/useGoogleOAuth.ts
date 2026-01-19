import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

interface OAuthStatus {
  isConnected: boolean;
  requiresReconnect: boolean;
  expiresAt: string | null;
}

export const useGoogleOAuth = () => {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const getOAuthClientId = async (): Promise<string | null> => {
    // The client ID should be fetched from an edge function or stored publicly
    // For now, we'll use an edge function to get the auth URL
    try {
      const { data, error } = await supabase.functions.invoke("get-google-oauth-url", {
        body: { 
          user_id: user?.id,
          redirect_uri: `${window.location.origin}/oauth/callback`
        }
      });
      if (error) throw error;
      return data?.client_id || null;
    } catch {
      return null;
    }
  };

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
      // Build OAuth URL with custom client
      const { data, error } = await supabase.functions.invoke("get-google-oauth-url", {
        body: { 
          user_id: user.id,
          redirect_uri: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      if (data?.auth_url) {
        // Store user_id in session storage for callback
        sessionStorage.setItem("google_oauth_user_id", user.id);
        // Open in new window to avoid iframe/webview restrictions from Google
        window.open(data.auth_url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Failed to get OAuth URL");
      }
    } catch (error) {
      console.error("OAuth initiation error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'initier la connexion Google.",
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
      return { isConnected: false, requiresReconnect: false, expiresAt: null };
    }

    setIsCheckingStatus(true);

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("google_refresh_token, google_token_expires_at")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const isConnected = !!profile?.google_refresh_token;
      const expiresAt = profile?.google_token_expires_at || null;

      return {
        isConnected,
        requiresReconnect: !isConnected,
        expiresAt,
      };
    } catch (error) {
      console.error("Error checking OAuth status:", error);
      return { isConnected: false, requiresReconnect: true, expiresAt: null };
    } finally {
      setIsCheckingStatus(false);
    }
  }, [user]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke("refresh-google-token", {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.success && data?.access_token) {
        return data.access_token;
      }

      if (data?.requires_reconnect) {
        toast({
          title: "Reconnexion requise",
          description: "Veuillez reconnecter votre compte Google.",
          variant: "destructive",
        });
      }

      return null;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  }, [user]);

  return {
    initiateOAuth,
    handleOAuthCallback,
    checkOAuthStatus,
    refreshAccessToken,
    isConnecting,
    isCheckingStatus,
  };
};
