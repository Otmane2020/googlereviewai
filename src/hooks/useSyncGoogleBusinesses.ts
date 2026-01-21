import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleBusiness {
  name: string;
  google_place_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
}

interface SyncResult {
  success: boolean;
  businesses: any[];
  requires_reconnect?: boolean;
  requires_selection?: boolean;
  google_businesses?: GoogleBusiness[];
  max_businesses?: number;
  message?: string;
}

export const useSyncGoogleBusinesses = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncBusinesses = async (): Promise<SyncResult> => {
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
