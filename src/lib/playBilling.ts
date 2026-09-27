import { supabase } from "@/integrations/supabase/client";
import { isAndroidApp } from "@/lib/androidApp";

// Google Play Billing through the Digital Goods API, only available inside
// the Android app (TWA). The website keeps selling with Stripe.
export const PLAY_BILLING_METHOD = "https://play.google.com/billing";

// Same keys as the Stripe price keys; configured as products in Play Console.
export const PLAY_SUBSCRIPTION_SKUS = [
  "ranki_starter_monthly",
  "ranki_starter_yearly",
  "ranki_pro_monthly",
  "ranki_pro_yearly",
  "ranki_business_monthly",
  "ranki_business_yearly",
] as const;

export const PLAY_CREDIT_SKUS = ["credits_10", "credits_100", "credits_330", "credits_660", "credits_1000"] as const;

export type PlayItemDetails = {
  itemId: string;
  title: string;
  description?: string;
  price: { currency: string; value: string };
  subscriptionPeriod?: string;
};

type DigitalGoodsService = {
  getDetails: (itemIds: string[]) => Promise<PlayItemDetails[]>;
};

declare global {
  interface Window {
    getDigitalGoodsService?: (paymentMethod: string) => Promise<DigitalGoodsService>;
  }
}

export const getPlayBillingService = async (): Promise<DigitalGoodsService | null> => {
  if (!isAndroidApp() || typeof window.getDigitalGoodsService !== "function") return null;
  try {
    return await window.getDigitalGoodsService(PLAY_BILLING_METHOD);
  } catch (e) {
    console.warn("[playBilling] Digital Goods API unavailable:", e);
    return null;
  }
};

export const formatPlayPrice = (price: PlayItemDetails["price"], locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: price.currency }).format(Number(price.value));

/**
 * Opens the Google Play purchase sheet, then lets the backend verify,
 * acknowledge/consume the purchase and update the profile.
 * Returns false if the user closed the sheet.
 */
export const purchaseWithPlay = async (sku: string): Promise<boolean> => {
  const request = new PaymentRequest(
    [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku } }],
    // Required by the Payment Request API; Google Play shows its own price.
    { total: { label: "Total", amount: { currency: "EUR", value: "0" } } },
  );

  let response: PaymentResponse;
  try {
    response = await request.show();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return false;
    throw e;
  }

  const { purchaseToken } = response.details as { purchaseToken: string };
  const { data, error } = await supabase.functions.invoke("verify-play-purchase", {
    body: { sku, purchaseToken },
  });
  const ok = !error && data?.success;
  await response.complete(ok ? "success" : "fail");
  if (!ok) throw new Error(data?.error || error?.message || "Play purchase verification failed");
  return true;
};

export const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions?package=com.googlereviewai.app";
