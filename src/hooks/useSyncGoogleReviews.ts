import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SyncReviewsResult {
  success: boolean;
  message: string;
  reviews: any[];
  synced_count: number;
  errors?: string[];
}

export const useSyncGoogleReviews = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncReviewsResult | null>(null);

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

      const providerToken = session.provider_token;
      
      if (!providerToken) {
        toast({
          title: "Token Google manquant",
          description: "Veuillez vous déconnecter et vous reconnecter avec Google.",
          variant: "destructive",
        });
        return null;
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
