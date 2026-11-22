import { test, expect } from "bun:test";
import { TOOLS, makeReviewsAiContext } from "../src/lib/mcp/core.ts";
import { existsSync, readFileSync } from "node:fs";

const SUPABASE = "https://proj.supabase.co";
const BUSINESS = {
  id: "biz-1", name: "Chez Paul", address: "Lyon", google_place_id: "loc-1", rating: 4.6,
  total_reviews: 120, website: null, phone: null, maps_url: null, last_reviews_sync_at: null,
};
const review = (over = {}) => ({
  id: 42, location_id: "loc-1", author: "Marie", rating: 2, comment: "Service lent",
  review_date: "2026-11-10", ai_response: null, google_reply: null, published_to_google: false, ...over,
});

function ctx(calls = [], reviewOver = {}) {
  const fetchImpl = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const method = init.method ?? (typeof input === "string" ? "GET" : input.method);
    let body = init.body;
    if (body === undefined && typeof input !== "string" && input.body) body = await input.text();
    const headers = new Headers(init.headers ?? (typeof input === "string" ? undefined : input.headers));
    calls.push({ url, method, body, auth: headers.get("authorization") });
    const ok = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (url.includes("/rest/v1/businesses")) return ok([BUSINESS]);
    if (url.includes("/rest/v1/reviews") && method === "PATCH") return ok([]);
    if (url.includes("/rest/v1/reviews") && url.includes("id=eq.42")) return ok(review(reviewOver));
    if (url.includes("/rest/v1/reviews")) return ok([review(reviewOver)]);
    if (url.endsWith("/functions/v1/generate-ai-response"))
      return ok({ success: true, response: "Merci Marie… — L'équipe Chez Paul", credits_remaining: 9, language: "fr" });
    if (url.endsWith("/functions/v1/publish-google-reply")) return ok({ success: true });
    if (url.endsWith("/functions/v1/get-gmb-insights")) return ok({ requires_reconnect: true, insights: null });
    return ok({ error: "unexpected " + url }, 500);
  };
  return makeReviewsAiContext("user-token", "user-1", { supabaseUrl: SUPABASE, supabaseKey: "sb_publishable_x", fetchImpl });
}
const run = (name, args, c) => TOOLS.find((t) => t.name === name).run(args, c);

test("every tool has its own default-exported file and is registered on the server", () => {
  // @lovable.dev/mcp-js discovers one tool per file; a shared file only exposed list_managed_businesses in production.
  const index = readFileSync(new URL("../src/lib/mcp/index.ts", import.meta.url), "utf8");
  for (const t of TOOLS) {
    const file = t.name.replaceAll("_", "-");
    const path = new URL(`../src/lib/mcp/tools/${file}.ts`, import.meta.url);
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, "utf8");
    expect(src).toContain("export default defineTool(");
    expect(src).toContain(`reviewsAiToolConfig("${t.name}")`);
    expect(index).toContain(`./tools/${file}"`);
  }
});

test("every tool has a title and safety annotations", () => {
  for (const t of TOOLS) {
    expect(typeof t.title).toBe("string");
    expect(typeof t.annotations.readOnlyHint).toBe("boolean");
    expect(typeof t.annotations.openWorldHint).toBe("boolean");
    if (!t.annotations.readOnlyHint) expect(typeof t.annotations.destructiveHint).toBe("boolean");
  }
  expect(TOOLS.find((t) => t.name === "publish_review_reply").annotations.destructiveHint).toBe(true);
});

test("list_reviews scopes to active locations and uses the caller token", async () => {
  const calls = [];
  const out = await run("list_reviews", { status: "unanswered" }, ctx(calls));
  expect(out.reviews[0]).toMatchObject({ review_id: 42, business: "Chez Paul", answered: false });
  const r = calls.find((c) => c.url.includes("/rest/v1/reviews"));
  expect(decodeURIComponent(r.url)).toContain("location_id=in.(loc-1)");
  expect(r.auth).toBe("Bearer user-token");
});

test("generate_review_reply delegates to the edge function", async () => {
  const calls = [];
  const out = await run("generate_review_reply", { review_id: 42 }, ctx(calls));
  expect(out).toMatchObject({ published: false, credits_remaining: 9 });
  const fn = calls.find((c) => c.url.endsWith("/generate-ai-response"));
  expect(JSON.parse(fn.body)).toMatchObject({ reviewId: 42, businessId: "biz-1" });
  expect(fn.auth).toBe("Bearer user-token");
});

test("publish_review_reply saves the approved text before publishing", async () => {
  const calls = [];
  const out = await run("publish_review_reply", { review_id: 42, reply_text: "Merci !" }, ctx(calls));
  expect(out.published).toBe(true);
  const patch = calls.findIndex((c) => c.method === "PATCH");
  const pub = calls.findIndex((c) => c.url.endsWith("/publish-google-reply"));
  expect(patch).toBeGreaterThan(-1);
  expect(pub).toBeGreaterThan(patch);
});

test("publish is refused without draft or text, and when already answered", async () => {
  await expect(run("publish_review_reply", { review_id: 42 }, ctx())).rejects.toThrow("brouillon");
  await expect(
    run("publish_review_reply", { review_id: 42, reply_text: "x" }, ctx([], { google_reply: "déjà" })),
  ).rejects.toThrow("déjà");
});

test("Google reconnect errors are explained to the user", async () => {
  await expect(run("get_business_insights", {}, ctx())).rejects.toThrow("Reconnectez Google");
});
