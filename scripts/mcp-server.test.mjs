import { test, expect } from "bun:test";
import { handleMcpRequest, TOOLS } from "../src/lib/mcp/server.ts";

const SUPABASE = "https://proj.supabase.co";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const makeToken = (claims) =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    iss: `${SUPABASE}/auth/v1`,
    sub: "user-1",
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: "authenticated",
    client_id: "client-claude",
    ...claims,
  })}.sig`;

const BUSINESS = {
  id: "biz-1", name: "Chez Paul", address: "Lyon", google_place_id: "loc-1", rating: 4.6,
  total_reviews: 120, website: null, phone: null, maps_url: null, last_reviews_sync_at: null,
};
const REVIEW = {
  id: 42, location_id: "loc-1", author: "Marie", rating: 2, comment: "Service lent",
  review_date: "2026-11-10", ai_response: null, google_reply: null, published_to_google: false,
};

function makeEnv(calls = []) {
  const fetchImpl = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const method = init.method ?? (typeof input === "string" ? "GET" : input.method);
    let body = init.body;
    if (body === undefined && typeof input !== "string" && input.body) body = await input.text();
    calls.push({ url, method, body });
    const ok = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (url.includes("/auth/v1/.well-known/jwks.json")) return ok({ keys: [] });
    if (url.includes("/auth/v1/user")) return ok({ id: "user-1", aud: "authenticated", role: "authenticated" });
    if (url.includes("/rest/v1/businesses")) return ok([BUSINESS]);
    if (url.includes("/rest/v1/reviews") && method === "PATCH") return ok([]);
    if (url.includes("/rest/v1/reviews") && url.includes("id=eq.42")) return ok(REVIEW);
    if (url.includes("/rest/v1/reviews")) return ok([REVIEW]);
    if (url.endsWith("/functions/v1/generate-ai-response"))
      return ok({ success: true, response: "Merci Marie… — L'équipe Chez Paul", credits_remaining: 9, language: "fr" });
    if (url.endsWith("/functions/v1/publish-google-reply")) return ok({ success: true });
    return ok({ error: "unexpected " + url }, 500);
  };
  return { supabaseUrl: SUPABASE, supabaseKey: "sb_publishable_x", publicOrigin: "https://reviewsai.store", fetchImpl };
}

const rpc = (body, token = makeToken({})) =>
  new Request("https://reviewsai.store/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

test("missing token returns 401 with resource metadata challenge", async () => {
  const res = await handleMcpRequest(rpc({ jsonrpc: "2.0", id: 1, method: "initialize" }, null), makeEnv());
  expect(res.status).toBe(401);
  expect(res.headers.get("www-authenticate")).toContain(
    'resource_metadata="https://reviewsai.store/.well-known/oauth-protected-resource/mcp"',
  );
});

test("first-party session tokens without client_id are rejected", async () => {
  const res = await handleMcpRequest(
    rpc({ jsonrpc: "2.0", id: 1, method: "initialize" }, makeToken({ client_id: undefined })),
    makeEnv(),
  );
  expect(res.status).toBe(401);
});

test("tokens from another issuer are rejected", async () => {
  const res = await handleMcpRequest(
    rpc({ jsonrpc: "2.0", id: 1, method: "initialize" }, makeToken({ iss: "https://evil.supabase.co/auth/v1" })),
    makeEnv(),
  );
  expect(res.status).toBe(401);
});

test("initialize negotiates protocol and advertises tools", async () => {
  const res = await handleMcpRequest(
    rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {} } }),
    makeEnv(),
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.result.protocolVersion).toBe("2025-06-18");
  expect(body.result.capabilities.tools).toBeDefined();
});

test("notifications get 202 with no body", async () => {
  const res = await handleMcpRequest(rpc({ jsonrpc: "2.0", method: "notifications/initialized" }), makeEnv());
  expect(res.status).toBe(202);
});

test("every tool has a title and safety annotations", async () => {
  const res = await handleMcpRequest(rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }), makeEnv());
  const { result } = await res.json();
  expect(result.tools.length).toBe(TOOLS.length);
  for (const t of result.tools) {
    expect(typeof t.title).toBe("string");
    expect(typeof t.annotations.readOnlyHint).toBe("boolean");
    expect(typeof t.annotations.openWorldHint).toBe("boolean");
    if (!t.annotations.readOnlyHint) expect(typeof t.annotations.destructiveHint).toBe("boolean");
  }
  expect(result.tools.find((t) => t.name === "publish_review_reply").annotations.destructiveHint).toBe(true);
});

test("list_reviews scopes to active locations and maps business names", async () => {
  const calls = [];
  const res = await handleMcpRequest(
    rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "list_reviews", arguments: { status: "unanswered" } } }),
    makeEnv(calls),
  );
  const { result } = await res.json();
  expect(result.isError).toBe(false);
  expect(result.structuredContent.reviews[0]).toMatchObject({ review_id: 42, business: "Chez Paul", answered: false });
  const reviewsCall = calls.find((c) => c.url.includes("/rest/v1/reviews"));
  expect(decodeURIComponent(reviewsCall.url)).toContain("location_id=in.(loc-1)");
});

test("generate_review_reply delegates to the edge function with the user token", async () => {
  const calls = [];
  const res = await handleMcpRequest(
    rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "generate_review_reply", arguments: { review_id: 42 } } }),
    makeEnv(calls),
  );
  const { result } = await res.json();
  expect(result.structuredContent.draft_reply).toContain("Merci Marie");
  expect(result.structuredContent.published).toBe(false);
  const fn = calls.find((c) => c.url.endsWith("/generate-ai-response"));
  expect(JSON.parse(fn.body)).toMatchObject({ reviewId: 42, businessId: "biz-1" });
});

test("publish_review_reply saves the approved text before publishing", async () => {
  const calls = [];
  const res = await handleMcpRequest(
    rpc({
      jsonrpc: "2.0", id: 5, method: "tools/call",
      params: { name: "publish_review_reply", arguments: { review_id: 42, reply_text: "Merci, nous allons nous améliorer." } },
    }),
    makeEnv(calls),
  );
  const { result } = await res.json();
  expect(result.isError).toBe(false);
  const patchIdx = calls.findIndex((c) => c.method === "PATCH");
  const publishIdx = calls.findIndex((c) => c.url.endsWith("/publish-google-reply"));
  expect(patchIdx).toBeGreaterThan(-1);
  expect(publishIdx).toBeGreaterThan(patchIdx);
});

test("publish without draft or text is refused as a tool error", async () => {
  const res = await handleMcpRequest(
    rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "publish_review_reply", arguments: { review_id: 42 } } }),
    makeEnv(),
  );
  const { result } = await res.json();
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain("brouillon");
});

test("unknown methods return JSON-RPC errors", async () => {
  const res = await handleMcpRequest(rpc({ jsonrpc: "2.0", id: 7, method: "nope" }), makeEnv());
  expect((await res.json()).error.code).toBe(-32601);
});
