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
        if (result.businesses.length > 0) {
          toast({
            title: "Synchronisation réussie",
            description: `${result.businesses.length} établissement(s) synchronisé(s)`,
          });
        } else {
          toast({
            title: "Aucun établissement trouvé",
            description: result.message,
          });
        }
      } else {
        toast({
          title: "Erreur de synchronisation",
          description: result.message || result.error,
          variant: "destructive",
        });
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