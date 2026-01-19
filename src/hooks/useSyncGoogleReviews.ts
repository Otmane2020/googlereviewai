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

export const useSyncGoogleReviews = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncReviewsResult | null>(null);

  const refreshGoogleToken = async (): Promise<string | null> => {
    try {
      // Try to refresh the session which might get a new provider token
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session:", error);
        return null;
      }
      return data.session?.provider_token || null;
    } catch (error) {
      console.error("Error in refreshGoogleToken:", error);
      return null;
    }
  };

  const syncReviews = async (businessId?: string): Promise<SyncReviewsResult | null> => {
    setIsSyncing(true);
    
    try {
      // Get the current session to get the provider token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Non connecté",
          description: "Veuillez vous connecter pour synchroniser les avis.",
          variant: "destructive",
        });
        return null;
      }

      let providerToken = session.provider_token;
      
      // If no provider token, try to refresh the session
      if (!providerToken) {
        console.log("No provider token, attempting to refresh session...");
        providerToken = await refreshGoogleToken();
        
        if (!providerToken) {
          // Return a result that indicates reconnection is needed
          const result: SyncReviewsResult = {
            success: false,
            message: "Session Google expirée. Veuillez vous déconnecter et vous reconnecter avec Google.",
            reviews: [],
            synced_count: 0,
            requires_reconnect: true,
          };
          setLastSyncResult(result);
          toast({
            title: "Session expirée",
            description: "Déconnectez-vous et reconnectez-vous avec Google pour synchroniser.",
            variant: "destructive",
          });
          return result;
        }
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
            description: "Déconnectez-vous et reconnectez-vous avec Google.",
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
