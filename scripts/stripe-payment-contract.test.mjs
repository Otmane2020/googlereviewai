import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const checkout = readFileSync("supabase/functions/create-checkout/index.ts", "utf8");
const webhook = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
const migration = readFileSync("supabase/migrations/20261016114500_stripe_credit_pack_purchases.sql", "utf8");
const settings = readFileSync("supabase/config.toml", "utf8");
const modal = readFileSync("src/components/UpgradeDialog.tsx", "utf8");

test("Stripe credit packs use the same trusted live Stripe price IDs at checkout and fulfillment", () => {
  const packIds = {
    credits_10: "price_1SrrYEEfti9t9nN9N8l9AaA1",
    credits_100: "price_1SrrYFEfti9t9nN9Y4zxBb3p",
    credits_330: "price_1SrrYGEfti9t9nN9z01pdk3y",
    credits_660: "price_1SrrYIEfti9t9nN9q8NplGxN",
    credits_1000: "price_1SrrYJEfti9t9nN9Bv7IhpUP",
    credits_1660: "price_1SrrYKEfti9t9nN920sUpYws",
    credits_3330: "price_1SrrYMEfti9t9nN9fqqz5xfd",
    credits_6660: "price_1SrrYNEfti9t9nN9deRwwVI3",
    credits_10000: "price_1SrrYOEfti9t9nN9TxSVXmcs",
  };
  for (const [key, id] of Object.entries(packIds)) {
    expect(checkout).toContain(`${key}: "${id}"`);
    expect(webhook).toContain(`"${id}": ${Number(key.split("_")[1])}`);
  }
});

test("Stripe must be able to call signed webhook while checkout remains JWT protected", () => {
  expect(settings).toMatch(/\[functions\.stripe-webhook\]\s*verify_jwt\s*=\s*false/);
  expect(settings).toMatch(/\[functions\.create-checkout\]\s*verify_jwt\s*=\s*true/);
  expect(settings).toMatch(/\[functions\.create-portal-session\]\s*verify_jwt\s*=\s*true/);
  expect(webhook).toContain("constructEventAsync");
  expect(webhook).toContain('if (!webhookSecret)');
  expect(webhook).not.toContain("event = JSON.parse(body)");
});

test("one-time credits are granted once, after Stripe confirms paid status", () => {
  expect(webhook).toContain('session.mode === "payment" && session.payment_status === "paid"');
  expect(webhook).toContain('case "checkout.session.async_payment_succeeded"');
  expect(webhook).toContain('"grant_stripe_checkout_credits"');
  expect(webhook).toContain("listLineItems");
  expect(migration).toContain("PRIMARY KEY");
  expect(migration).toContain("ON CONFLICT (stripe_session_id) DO NOTHING");
  expect(migration).toContain("COALESCE(credits, 0) + p_credits");
  expect(migration).toContain("REVOKE ALL ON FUNCTION");
  expect(migration).toContain("GRANT EXECUTE ON FUNCTION");
});

test("payment modal surfaces server error rather than hiding it", () => {
  expect(modal).toContain('checkoutErrorMessage(');
  expect(modal).toContain("window.location.assign(data.url)");
  expect(checkout).toContain("STRIPE_NOT_CONFIGURED");
  expect(checkout).toContain("STRIPE_AUTH_FAILED");
  expect(checkout).toContain("STRIPE_PRICE_MISMATCH");
  expect(checkout).toContain("safeOrigin");
});
