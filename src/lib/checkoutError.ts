/** Translate safely exposed Checkout errors returned by Supabase Edge Functions. */
type CheckoutErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  request_id?: string | null;
};
export async function checkoutErrorMessage(
  error: unknown,
  data: CheckoutErrorPayload | null | undefined,
  isEnglish: boolean,
): Promise<string> {
  const result: CheckoutErrorPayload = { ...(data || {}) };
  if (error && typeof error === "object" && "context" in error) {
    try {
      const context = (error as { context?: Response }).context;
      if (context && typeof context.clone === "function") {
        const payload = await context.clone().json() as CheckoutErrorPayload;
        Object.assign(result, payload);
      }
    } catch {
      // Network/CORS/previous backend response may not be JSON.
    }
  }

  const codes: Record<string, [string, string]> = {
    STRIPE_NOT_CONFIGURED: [
      "Le paiement n'est pas encore configuré. L'administrateur doit ajouter STRIPE_SECRET_KEY dans les secrets des Edge Functions.",
      "Payments are not configured. The administrator must add STRIPE_SECRET_KEY to Edge Function secrets.",
    ],
    STRIPE_AUTH_FAILED: [
      "La clé Stripe est invalide ou ne correspond pas au compte de paiement.",
      "The Stripe key is invalid or does not match the payment account.",
    ],
    STRIPE_PERMISSION_DENIED: [
      "La clé Stripe n'a pas les droits nécessaires pour créer un paiement.",
      "The Stripe key is not allowed to create Checkout sessions.",
    ],
    STRIPE_PRICE_MISMATCH: [
      "Les tarifs Stripe ne correspondent pas au compte configuré.",
      "Stripe prices do not belong to the configured Stripe account.",
    ],
    AUTH_EXPIRED: [
      "Votre session a expiré. Reconnectez-vous puis réessayez.",
      "Your session expired. Please sign in again and retry.",
    ],
    AUTH_REQUIRED: [
      "Connectez-vous pour effectuer un paiement.",
      "Sign in before proceeding to payment.",
    ],
    CHECKOUT_FUNCTION_UNAVAILABLE: [
      "La fonction de paiement n'est pas déployée. Déployez create-checkout.",
      "The checkout function is not deployed. Deploy create-checkout.",
    ],
  };
  const known = result.code && codes[result.code];
  const message = known
    ? known[isEnglish ? 1 : 0]
    : result.error || result.message ||
      (isEnglish ? "Unable to start secure Stripe checkout." : "Impossible d'ouvrir le paiement Stripe.");
  return result.request_id ? `${message} (Stripe: ${result.request_id})`
    : result.code && !known ? `${message} [${result.code}]` : message;
}
