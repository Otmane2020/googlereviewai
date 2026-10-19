import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const pricing = readFileSync("src/components/ranki/RankiPricingSection.tsx", "utf8");
const checkout = readFileSync("supabase/functions/create-checkout/index.ts", "utf8");
const webhook = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
const access = readFileSync("supabase/functions/_shared/plan-access.ts", "utf8");
const client = readFileSync("src/lib/planEntitlements.ts", "utf8");

test("six monthly/yearly USD plan prices remain consistent between UI, checkout and webhook", () => {
  const prices = {
    ranki_starter_monthly_usd: "price_1UQtGKEfti9t9nN9XyTCtHYK",
    ranki_starter_yearly_usd: "price_1UQtGMEfti9t9nN973J7Avoy",
    ranki_pro_monthly_usd: "price_1UQtGUEfti9t9nN9Fsfqwlfj",
    ranki_pro_yearly_usd: "price_1UQtGWEfti9t9nN9QNQxVIYI",
    ranki_business_monthly_usd: "price_1UQtGZEfti9t9nN9143Lii65",
    ranki_business_yearly_usd: "price_1UQtGbEfti9t9nN9cNGQpdnJ",
  };
  for (const [key, id] of Object.entries(prices)) {
    expect(pricing).toContain(key);
    expect(checkout).toContain(id);
    expect(webhook).toContain(id);
  }
});

test("plan access uses verified subscription status and enforces the 1/3/999 location policy", () => {
  expect(client).toContain("isActivePaidPlan(profile)");
  expect(client).toContain('if (tier === "pro") return 3');
  expect(client).toContain('if (tier === "business") return 999');
  expect(access).toContain('tier === "business" ? 999 : tier === "pro" ? 3 : 1');
  expect(access).toContain('["pro", "business"].includes(activePlanTier(p))');
  expect(access).toContain("hasUnlimitedAiReplies");
});

test("marketing copy does not claim unverified Business services or automated daily maps scans", () => {
  for (const claim of [
    "Daily GEO Rank tracking on Maps",
    "GEO Rank quotidien (suivi positionnement Maps)",
    "Dedicated account manager",
    "Manager dédié",
    "Advanced API and webhooks",
    "API & webhooks avancés",
    "Custom reports",
    "Rapports personnalisés",
    "Unlimited locations",
    "Établissements illimités",
  ]) {
    expect(pricing).not.toContain(claim);
  }
});
