import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useSyncGoogleBusinesses = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncBusinesses = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      const providerToken = session.provider_token;
      
      if (!providerToken) {
        toast({
          title: "Token Google manquant",
          description: "Veuillez vous déconnecter et vous reconnecter avec Google pour synchroniser vos établissements.",
          variant: "destructive",
        });
        return { success: false, businesses: [] };
      }

      const response = await supabase.functions.invoke("sync-google-businesses", {
        body: { provider_token: providerToken },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.success) {
        // Silent success - no toast for sync
        if (result.businesses.length === 0) {
          toast({
            title: "Aucun établissement trouvé",
            description: result.message,
          });
        }
      } else {
        // Handle specific error codes gracefully
        if (result.error_code === "QUOTA_EXCEEDED") {
          toast({
            title: "Accès API en attente",
            description: "L'accès à l'API Google Business Profile doit être demandé via le formulaire officiel Google. Le quota est actuellement à 0.",
          });
        } else if (result.error_code === "ACCESS_DENIED") {
          toast({
            title: "Accès refusé",
            description: "Veuillez vérifier que votre compte Google a accès à Google Business Profile.",
          });
        } else {
          toast({
            title: "Synchronisation impossible",
            description: result.message || "Une erreur s'est produite lors de la synchronisation.",
          });
        }
      }

      return result;
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, businesses: [] };
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncBusinesses, isSyncing };
};