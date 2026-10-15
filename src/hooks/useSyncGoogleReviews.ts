import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SyncReviewsResult {
  success: boolean;
  message: string;
  reviews: unknown[];
  synced_count: number;
  errors?: string[];
  requires_reconnect?: boolean;
  partial?: boolean;
}

export const useSyncGoogleReviews = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncReviewsResult | null>(null);

  const syncReviews = async (businessId?: string): Promise<SyncReviewsResult> => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const missing: SyncReviewsResult = {
          success: false, message: "Session expirée. Veuillez vous reconnecter.",
          reviews: [], synced_count: 0,
        };
        setLastSyncResult(missing);
        return missing;
      }

      // The server renews the stored Google refresh token by itself.
      // Never request or forward a Google access token to the browser.
      // business_id scopes imports to the currently selected managed location.
      const { data, error } = await supabase.functions.invoke<SyncReviewsResult>(
        "sync-google-reviews",
        { body: { business_id: businessId || null } },
      );

      if (error || !data) {
        let message = error?.message || "Aucune réponse du service de synchronisation.";
        if (error && "context" in error) {
          try {
            const context = (error as { context?: Response }).context;
            const detail = await context?.clone?.().json?.();
            message = detail?.message || detail?.error || message;
          } catch {
            // Network/server error text remains available.
          }
        }
        const failed: SyncReviewsResult = {
          success: false, message, reviews: [], synced_count: 0,
        };
        setLastSyncResult(failed);
        return failed;
      }

      const result: SyncReviewsResult = {
        success: data.success === true,
        message: data.message || "",
        reviews: data.reviews || [],
        synced_count: data.synced_count || 0,
        errors: data.errors,
        partial: data.partial || Boolean(data.errors?.length),
        requires_reconnect: data.requires_reconnect,
      };
      setLastSyncResult(result);
      return result;
    } catch (error) {
      const failed: SyncReviewsResult = {
        success: false,
        message: error instanceof Error ? error.message : "Impossible de synchroniser Google.",
        reviews: [],
        synced_count: 0,
      };
      setLastSyncResult(failed);
      return failed;
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncReviews, isSyncing, lastSyncResult };
};
