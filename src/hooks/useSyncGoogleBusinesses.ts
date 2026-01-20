import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        console.error("Missing Google provider token");
        return { success: false, businesses: [], requires_reconnect: true };
      }

      const response = await supabase.functions.invoke("sync-google-businesses", {
        body: { provider_token: providerToken },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error: any) {
      console.error("Sync error:", error);
      return { success: false, businesses: [] };
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncBusinesses, isSyncing };
};
