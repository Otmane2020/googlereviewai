import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Initialize Stripe with publishable key from env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface EmbeddedCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceKey: string;
  planName: string;
}

export const EmbeddedCheckoutDialog = ({
  open,
  onOpenChange,
  priceKey,
  planName,
}: EmbeddedCheckoutDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-embedded-checkout", {
        body: { priceKey },
      });

      if (error) {
        console.error("[EmbeddedCheckout] Error:", error);
        setError(error.message || "Erreur lors de la création du checkout");
        throw error;
      }

      if (!data?.clientSecret) {
        throw new Error("No client secret returned");
      }

      console.log("[EmbeddedCheckout] Client secret obtained");
      return data.clientSecret;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [priceKey]);

  const options = {
    fetchClientSecret,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl p-0 overflow-hidden max-h-[90vh]">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="text-lg font-semibold">Paiement - {planName}</h2>
          <p className="text-sm text-muted-foreground">
            Paiement sécurisé par Stripe
          </p>
        </div>
        
        <div className="min-h-[400px] max-h-[calc(90vh-100px)] overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <p className="text-destructive text-center mb-4">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-primary hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
