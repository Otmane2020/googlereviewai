#!/usr/bin/env node
// Creates the Google Play subscriptions and credit packs sold in the Android
// app (same IDs as src/lib/playBilling.ts and supabase/functions/_shared/googlePlay.ts).
//
// Usage: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{...}' node android/scripts/setup-play-products.mjs [--dry-run]
// The service account must be invited in Play Console with admin rights on the app,
// and the app must already have an uploaded build (internal testing is enough).
import { createSign } from "node:crypto";

const PACKAGE = process.env.GOOGLE_PLAY_PACKAGE_NAME ?? "com.googlereviewai.app";
const DRY_RUN = process.argv.includes("--dry-run");
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}`;

// Prices in EUR, VAT included (same as the Stripe prices on the website).
const SUBSCRIPTIONS = [
  { id: "ranki_starter_monthly", title: "Starter (mensuel)", period: "P1M", eur: "9.99", benefits: ["1 établissement", "Réponses IA 24/7", "50 crédits / mois"] },
  { id: "ranki_starter_yearly", title: "Starter (annuel)", period: "P1Y", eur: "95.90", benefits: ["1 établissement", "Réponses IA 24/7", "50 crédits / mois"] },
  { id: "ranki_pro_monthly", title: "Pro (mensuel)", period: "P1M", eur: "49.00", benefits: ["3 établissements", "GEO Rank quotidien", "SEO/AEO automatiques"] },
  { id: "ranki_pro_yearly", title: "Pro (annuel)", period: "P1Y", eur: "470.00", benefits: ["3 établissements", "GEO Rank quotidien", "SEO/AEO automatiques"] },
  { id: "ranki_business_monthly", title: "Business (mensuel)", period: "P1M", eur: "99.00", benefits: ["Établissements illimités", "GEO + SEO/AEO illimités", "Support dédié"] },
  { id: "ranki_business_yearly", title: "Business (annuel)", period: "P1Y", eur: "950.40", benefits: ["Établissements illimités", "GEO + SEO/AEO illimités", "Support dédié"] },
];
const CREDIT_PACKS = [
  { id: "credits_10", credits: 10, eur: "2.99" },
  { id: "credits_100", credits: 100, eur: "29.00" },
  { id: "credits_330", credits: 330, eur: "99.00" },
  { id: "credits_660", credits: 660, eur: "199.00" },
  { id: "credits_1000", credits: 1000, eur: "299.00" },
];

const money = (eur) => {
  const [units, cents = "0"] = eur.split(".");
  return { currencyCode: "EUR", units, nanos: Number(cents.padEnd(2, "0")) * 10_000_000 };
};

async function accessToken() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set");
  const sa = JSON.parse(raw);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OAuth failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

let token;
async function api(method, path, body) {
  if (DRY_RUN && method !== "GET") {
    console.log(`[dry-run] ${method} ${path}`, body ? JSON.stringify(body).slice(0, 200) : "");
    return {};
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (res.status === 404 && method === "GET") return null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function regionalPrices(eur) {
  // Google converts the EUR price into every Play region (local currency + taxes).
  const converted = await api("POST", "/pricing:convertRegionPrices", { price: money(eur) });
  return converted;
}

async function createSubscription(s) {
  if (!DRY_RUN && (await api("GET", `/subscriptions/${s.id}`))) {
    console.log(`= ${s.id} already exists`);
    return;
  }
  const basePlanId = s.period === "P1M" ? "monthly" : "yearly";
  const prices = DRY_RUN ? { convertedRegionPrices: {} } : await regionalPrices(s.eur);
  const regionalConfigs = Object.values(prices.convertedRegionPrices ?? {}).map((r) => ({
    regionCode: r.regionCode,
    newSubscriberAvailability: true,
    price: r.price,
  }));
  const regionsVersion = prices.regionVersion?.version ?? "2022/02";
  await api("POST", `/subscriptions?productId=${s.id}&regionsVersion.version=${encodeURIComponent(regionsVersion)}`, {
    packageName: PACKAGE,
    productId: s.id,
    listings: [{ languageCode: "fr-FR", title: s.title, benefits: s.benefits }],
    basePlans: [{
      basePlanId,
      autoRenewingBasePlanType: { billingPeriodDuration: s.period, resubscribeState: "RESUBSCRIBE_STATE_ACTIVE" },
      regionalConfigs,
      otherRegionsConfig: prices.convertedOtherRegionsPrice
        ? { usdPrice: prices.convertedOtherRegionsPrice.usdPrice, eurPrice: prices.convertedOtherRegionsPrice.eurPrice, newSubscriberAvailability: true }
        : undefined,
    }],
  });
  await api("POST", `/subscriptions/${s.id}/basePlans/${basePlanId}:activate`, {});
  console.log(`+ ${s.id} created and activated (${s.eur} €)`);
}

async function createCreditPack(p) {
  if (!DRY_RUN && (await api("GET", `/inappproducts/${p.id}`))) {
    console.log(`= ${p.id} already exists`);
    return;
  }
  await api("POST", `/inappproducts?autoConvertMissingPrices=true`, {
    packageName: PACKAGE,
    sku: p.id,
    status: "active",
    purchaseType: "managedUser",
    defaultLanguage: "fr-FR",
    defaultPrice: { priceMicros: String(Math.round(Number(p.eur) * 1_000_000)), currency: "EUR" },
    listings: { "fr-FR": { title: `${p.credits} crédits`, description: `Pack de ${p.credits} crédits IA` } },
  });
  console.log(`+ ${p.id} created (${p.eur} €)`);
}

token = DRY_RUN ? "" : await accessToken();
let failures = 0;
for (const s of SUBSCRIPTIONS) {
  try { await createSubscription(s); } catch (e) { failures++; console.error(`! ${s.id}: ${e.message}`); }
}
for (const p of CREDIT_PACKS) {
  try { await createCreditPack(p); } catch (e) { failures++; console.error(`! ${p.id}: ${e.message}`); }
}
process.exit(failures ? 1 : 0);
