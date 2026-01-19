import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SyncReviewsResult {
  success: boolean;
  message: string;
  reviews: any[];
  synced_count: number;
  errors?: string[];
  requires_reconnect?: boolean;
}

interface RefreshTokenResult {
  success: boolean;
  access_token?: string;
  expires_at?: string;
  error?: string;
  requires_reconnect?: boolean;
}

export const useSyncGoogleReviews = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncReviewsResult | null>(null);

  // Use the server-side refresh-google-token function to get a valid token
  const getValidGoogleToken = async (userId: string): Promise<{ token: string | null; requires_reconnect: boolean }> => {
    try {
      const { data, error } = await supabase.functions.invoke<RefreshTokenResult>(
        "refresh-google-token",
        { body: { user_id: userId } }
      );

      if (error) {
        console.error("Error calling refresh-google-token:", error);
        return { token: null, requires_reconnect: true };
      }

      if (data?.success && data.access_token) {
        console.log("Got valid Google token, expires at:", data.expires_at);
        return { token: data.access_token, requires_reconnect: false };
      }

      if (data?.requires_reconnect) {
        console.log("Reconnection required:", data.error);
        return { token: null, requires_reconnect: true };
      }

      console.error("Failed to get token:", data?.error);
      return { token: null, requires_reconnect: true };
    } catch (error) {
      console.error("Error in getValidGoogleToken:", error);
      return { token: null, requires_reconnect: true };
    }
  };

  const syncReviews = async (businessId?: string): Promise<SyncReviewsResult | null> => {
    setIsSyncing(true);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Non connecté",
          description: "Veuillez vous connecter pour synchroniser les avis.",
          variant: "destructive",
        });
        return null;
      }

      // First try the provider_token from current session (valid for ~1 hour after login)
      let providerToken = session.provider_token;
      
      // If no provider token in session, use server-side refresh
      if (!providerToken) {
        console.log("No provider token in session, using server-side refresh...");
        const { token, requires_reconnect } = await getValidGoogleToken(session.user.id);
        
        if (requires_reconnect || !token) {
          const result: SyncReviewsResult = {
            success: false,
            message: "Session Google expirée. Veuillez reconnecter votre compte Google.",
            reviews: [],
            synced_count: 0,
            requires_reconnect: true,
          };
          setLastSyncResult(result);
          toast({
            title: "Reconnexion requise",
            description: "Allez dans Paramètres → Connecter Google pour reconnecter votre compte.",
            variant: "destructive",
          });
          return result;
        }
        
        providerToken = token;
      }

      const { data, error } = await supabase.functions.invoke<SyncReviewsResult>(
        "sync-google-reviews",
        {
          body: { 
            provider_token: providerToken,
            business_id: businessId 
          },
        }
      );

      if (error) throw error;

      if (data) {
        setLastSyncResult(data);
        
        if (data.success) {
          toast({
            title: "Synchronisation réussie",
            description: data.message,
          });
        } else if (data.requires_reconnect) {
          toast({
            title: "Reconnexion requise",
            description: "Allez dans Paramètres → Connecter Google pour reconnecter votre compte.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur de synchronisation",
            description: data.message || "Une erreur est survenue.",
            variant: "destructive",
          });
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error("Error syncing reviews:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de synchroniser les avis.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncReviews,
    isSyncing,
    lastSyncResult,
  };
};
