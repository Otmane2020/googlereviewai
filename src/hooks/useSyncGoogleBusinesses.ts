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

  const syncBusinesses = async (forceShowSelection = false): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      // Google Business access comes from the server-stored refresh token.
      // Supabase provider_token only exists immediately after some login flows,
      // so requiring it silently blocked existing accounts and new locations.
      const response = await supabase.functions.invoke("sync-google-businesses", {
        body: { force_selection: forceShowSelection },
      });

      if (response.error) {
        const context = await response.error.context?.json?.().catch(() => null);
        throw new Error(context?.message || context?.error || response.error.message);
      }

      const result = response.data as SyncResult;
      if (!result?.success) {
        return { ...result, success: false, businesses: result?.businesses || [], message: result?.message || "La synchronisation Google a échoué." };
      }
      
      // If forceShowSelection is true and we have google_businesses, force selection mode
      if (forceShowSelection && result.google_businesses && result.google_businesses.length > 0) {
        return {
          ...result,
          requires_selection: true, // Force selection dialog to open
        };
      }

      return result;
    } catch (error: any) {
      console.error("Sync error:", error);
      return { success: false, businesses: [], message: error instanceof Error ? error.message : "Erreur de synchronisation" };
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncBusinesses, isSyncing };
};
