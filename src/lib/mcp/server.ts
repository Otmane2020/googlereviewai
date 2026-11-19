// Remote MCP server for ReviewsAI (Streamable HTTP, stateless, JSON responses).
//
// Auth model: Supabase Auth acts as the OAuth 2.1 authorization server.
// Claude / ChatGPT obtain a user access token through the consent page at
// /oauth/consent, then call this endpoint with `Authorization: Bearer <token>`.
// Every database read goes through RLS with that token, and every action is
// delegated to the existing edge functions with the same token, so the MCP
// server can never see or touch data the signed-in user could not.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MCP_PATH = "/mcp";
export const SCOPES = ["openid", "email", "profile"];
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "reviewsai", title: "ReviewsAI", version: "1.0.0" };

export interface McpEnv {
  supabaseUrl: string;
  supabaseKey: string; // publishable / anon key, never the service role
  publicOrigin: string; // e.g. https://reviewsai.store
  fetchImpl?: typeof fetch;
}

export function readMcpEnv(request: Request): McpEnv {
  const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;
  const meta = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
  const supabaseUrl = env.SUPABASE_URL || meta.VITE_SUPABASE_URL || "";
  const supabaseKey =
    env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || meta.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const url = new URL(request.url);
  // Behind Cloudflare the worker may see http://; advertise https except locally.
  if (url.protocol === "http:" && !/^(localhost|127\.0\.0\.1)$/.test(url.hostname)) url.protocol = "https:";
  const publicOrigin = env.MCP_PUBLIC_ORIGIN || url.origin;
  return { supabaseUrl: supabaseUrl.replace(/\/$/, ""), supabaseKey, publicOrigin: publicOrigin.replace(/\/$/, "") };
}

export const issuerFor = (env: McpEnv) => `${env.supabaseUrl}/auth/v1`;
export const resourceUri = (env: McpEnv) => `${env.publicOrigin}${MCP_PATH}`;
export const resourceMetadataUrl = (env: McpEnv) =>
  `${env.publicOrigin}/.well-known/oauth-protected-resource${MCP_PATH}`;

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id",
  "Access-Control-Expose-Headers": "www-authenticate, mcp-session-id, mcp-protocol-version",
};

export function protectedResourceMetadata(env: McpEnv) {
  return {
    resource: resourceUri(env),
    authorization_servers: [issuerFor(env)],
    scopes_supported: SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "ReviewsAI",
    resource_documentation: `${env.publicOrigin}/mcp-docs`,
  };
}

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

function unauthorized(env: McpEnv, error = "invalid_token", description = "Authentication required") {
  const challenge =
    `Bearer resource_metadata="${resourceMetadataUrl(env)}", scope="${SCOPES.join(" ")}"` +
    (error ? `, error="${error}", error_description="${description}"` : "");
  return json({ error: error || "unauthorized", error_description: description }, 401, {
    "WWW-Authenticate": challenge,
  });
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

interface ToolContext {
  db: SupabaseClient;
  userId: string;
  callFunction: (name: string, body: unknown) => Promise<{ status: number; data: any }>;
}

interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint: boolean;
  };
  run: (args: Record<string, any>, ctx: ToolContext) => Promise<unknown>;
}

class ToolError extends Error {}

const truncate = (s: string | null | undefined, n: number) =>
  s && s.length > n ? `${s.slice(0, n)}…` : s ?? null;

const clampInt = (v: unknown, min: number, max: number, dflt: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : dflt;
};

async function activeBusinesses(ctx: ToolContext) {
  const { data, error } = await ctx.db
    .from("businesses")
    .select("id, name, address, google_place_id, rating, total_reviews, website, phone, maps_url, last_reviews_sync_at")
    .eq("user_id", ctx.userId)
    .eq("is_active", true)
    .order("name");
  if (error) throw new ToolError(`Impossible de lire les établissements : ${error.message}`);
  return data ?? [];
}

async function requireBusiness(ctx: ToolContext, businessId: unknown) {
  if (typeof businessId !== "string" || !businessId) throw new ToolError("business_id est requis.");
  const list = await activeBusinesses(ctx);
  const biz = list.find((b) => b.id === businessId);
  if (!biz) throw new ToolError("Établissement introuvable ou inactif. Utilisez list_businesses.");
  return biz;
}

async function requireReview(ctx: ToolContext, reviewId: unknown) {
  const id = clampInt(reviewId, 1, Number.MAX_SAFE_INTEGER, 0);
  if (!id) throw new ToolError("review_id (entier) est requis.");
  const { data, error } = await ctx.db
    .from("reviews")
    .select("id, location_id, author, rating, comment, review_date, ai_response, google_reply, published_to_google")
    .eq("id", id)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (error) throw new ToolError(`Lecture de l'avis impossible : ${error.message}`);
  if (!data) throw new ToolError("Avis introuvable.");
  return data;
}

function functionError(name: string, res: { status: number; data: any }) {
  const d = res.data ?? {};
  if (d.requires_reconnect) {
    return new ToolError(
      "La connexion Google de ce compte a expiré. Reconnectez Google depuis https://reviewsai.store/dashboard puis réessayez.",
    );
  }
  if (res.status === 402 || d.upgrade_required) {
    return new ToolError("Crédits IA épuisés. Rechargez ou changez de forfait sur https://reviewsai.store/choose-plan.");
  }
  return new ToolError(d.message || d.error || `${name} a échoué (HTTP ${res.status}).`);
}

export const TOOLS: ToolDef[] = [
  {
    name: "list_businesses",
    title: "Lister les établissements",
    description:
      "List the Google Business Profile locations connected to the user's ReviewsAI account (name, address, rating, review count). Call this first to get business_id values.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (_args, ctx) => {
      const list = await activeBusinesses(ctx);
      return {
        businesses: list.map((b) => ({
          business_id: b.id,
          name: b.name,
          address: b.address,
          rating: b.rating,
          total_reviews: b.total_reviews,
          website: b.website,
          maps_url: b.maps_url,
          last_reviews_sync_at: b.last_reviews_sync_at,
        })),
      };
    },
  },
  {
    name: "list_reviews",
    title: "Lister les avis Google",
    description:
      "List Google reviews for the user's businesses, newest first. Filter by business, reply status (unanswered = no reply published on Google yet), star rating range and date. Returns review_id values used by generate_review_reply and publish_review_reply.",
    inputSchema: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Optional. Restrict to one business (from list_businesses)." },
        status: {
          type: "string",
          enum: ["unanswered", "answered", "all"],
          default: "all",
          description: "Reply status on Google.",
        },
        min_rating: { type: "integer", minimum: 1, maximum: 5 },
        max_rating: { type: "integer", minimum: 1, maximum: 5 },
        since: { type: "string", description: "Optional ISO date (YYYY-MM-DD). Only reviews posted on or after it." },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, ctx) => {
      const businesses = await activeBusinesses(ctx);
      const byLocation = new Map(businesses.map((b) => [b.google_place_id, b]));
      let locations = businesses.map((b) => b.google_place_id).filter(Boolean) as string[];
      if (args.business_id) {
        const biz = businesses.find((b) => b.id === args.business_id);
        if (!biz) throw new ToolError("Établissement introuvable ou inactif. Utilisez list_businesses.");
        locations = biz.google_place_id ? [biz.google_place_id] : [];
      }
      if (locations.length === 0) return { reviews: [], note: "Aucun établissement Google actif." };

      const limit = clampInt(args.limit, 1, 50, 20);
      let q = ctx.db
        .from("reviews")
        .select("id, location_id, author, rating, comment, review_date, ai_response, google_reply, published_to_google")
        .eq("user_id", ctx.userId)
        .in("location_id", locations)
        .order("review_date", { ascending: false })
        .limit(limit);
      if (args.status === "unanswered") q = q.is("google_reply", null).or("published_to_google.is.null,published_to_google.eq.false");
      if (args.status === "answered") q = q.or("google_reply.not.is.null,published_to_google.eq.true");
      if (args.min_rating) q = q.gte("rating", clampInt(args.min_rating, 1, 5, 1));
      if (args.max_rating) q = q.lte("rating", clampInt(args.max_rating, 1, 5, 5));
      if (typeof args.since === "string" && /^\d{4}-\d{2}-\d{2}/.test(args.since)) q = q.gte("review_date", args.since);
      const { data, error } = await q;
      if (error) throw new ToolError(`Lecture des avis impossible : ${error.message}`);
      return {
        reviews: (data ?? []).map((r) => ({
          review_id: r.id,
          business: byLocation.get(r.location_id)?.name ?? null,
          business_id: byLocation.get(r.location_id)?.id ?? null,
          author: r.author,
          rating: r.rating,
          date: r.review_date,
          comment: truncate(r.comment, 1500),
          published_reply: truncate(r.google_reply, 1500),
          draft_reply: r.google_reply ? null : truncate(r.ai_response, 1500),
          answered: Boolean(r.google_reply || r.published_to_google),
        })),
      };
    },
  },
  {
    name: "generate_review_reply",
    title: "Générer une réponse IA",
    description:
      "Draft an AI reply to one review in the business's brand voice and signature (as configured in ReviewsAI). The draft is saved on the review but NOT published. Uses one ReviewsAI credit on plans without unlimited replies. Show the draft to the user before publishing.",
    inputSchema: {
      type: "object",
      properties: {
        review_id: { type: "integer", description: "From list_reviews." },
        language: {
          type: "string",
          description: "Optional reply language code (e.g. fr, en, es). Defaults to the review's language.",
        },
      },
      required: ["review_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    run: async (args, ctx) => {
      const review = await requireReview(ctx, args.review_id);
      if (review.google_reply || review.published_to_google) {
        throw new ToolError("Cet avis a déjà une réponse publiée sur Google.");
      }
      const businesses = await activeBusinesses(ctx);
      const biz = businesses.find((b) => b.google_place_id === review.location_id);
      const res = await ctx.callFunction("generate-ai-response", {
        reviewId: review.id,
        businessId: biz?.id,
        ...(typeof args.language === "string" && args.language ? { language: args.language } : {}),
      });
      if (res.status >= 400 || !res.data?.success) throw functionError("generate-ai-response", res);
      return {
        review_id: review.id,
        draft_reply: res.data.response,
        language: res.data.language ?? null,
        credits_remaining: res.data.credits_remaining ?? null,
        published: false,
      };
    },
  },
  {
    name: "publish_review_reply",
    title: "Publier la réponse sur Google",
    description:
      "Publish a reply publicly on Google for one review. If `reply_text` is given it replaces the saved draft first; otherwise the saved draft (from generate_review_reply) is published. This is public and visible to everyone: only call it after the user has explicitly approved the exact text.",
    inputSchema: {
      type: "object",
      properties: {
        review_id: { type: "integer", description: "From list_reviews." },
        reply_text: { type: "string", maxLength: 4000, description: "Optional final text approved by the user." },
      },
      required: ["review_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    run: async (args, ctx) => {
      const review = await requireReview(ctx, args.review_id);
      if (review.google_reply || review.published_to_google) {
        throw new ToolError("Cet avis a déjà une réponse publiée sur Google.");
      }
      const text = typeof args.reply_text === "string" ? args.reply_text.trim() : "";
      if (text) {
        const { error } = await ctx.db
          .from("reviews")
          .update({ ai_response: text, needs_new_response: false })
          .eq("id", review.id)
          .eq("user_id", ctx.userId);
        if (error) throw new ToolError(`Enregistrement du texte impossible : ${error.message}`);
      } else if (!review.ai_response) {
        throw new ToolError("Aucun brouillon enregistré. Appelez generate_review_reply ou fournissez reply_text.");
      }
      const res = await ctx.callFunction("publish-google-reply", { review_id: review.id });
      if (res.status >= 400 || !res.data?.success) throw functionError("publish-google-reply", res);
      return { review_id: review.id, published: true, reply: text || review.ai_response };
    },
  },
  {
    name: "get_business_insights",
    title: "Statistiques Google Business",
    description:
      "Get Google Business Profile performance for the last N days: profile views (Search / Maps), calls, website clicks, direction requests. Omit business_id to aggregate all active businesses.",
    inputSchema: {
      type: "object",
      properties: {
        business_id: { type: "string" },
        days: { type: "integer", minimum: 7, maximum: 180, default: 30 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
    run: async (args, ctx) => {
      if (args.business_id) await requireBusiness(ctx, args.business_id);
      const res = await ctx.callFunction("get-gmb-insights", {
        business_id: args.business_id || undefined,
        days: clampInt(args.days, 7, 180, 30),
      });
      if (res.status >= 400 || res.data?.requires_reconnect || res.data?.success === false) {
        throw functionError("get-gmb-insights", res);
      }
      return { insights: res.data?.insights ?? null, warning: res.data?.warning ?? null };
    },
  },
  {
    name: "check_maps_ranking",
    title: "Mesurer le classement Google Maps",
    description:
      "Run a new local ranking scan: searches Google Maps for `keyword` on a grid of points around the business and returns its position at each point plus the average rank. Takes up to a minute and uses paid search quota; prefer get_ranking_history if a recent scan exists.",
    inputSchema: {
      type: "object",
      properties: {
        business_id: { type: "string" },
        keyword: { type: "string", minLength: 2, maxLength: 120, description: "e.g. \"restaurant italien lyon\"" },
        grid_size: { type: "integer", enum: [3, 5, 7], default: 3 },
        spacing_m: { type: "integer", minimum: 200, maximum: 5000, default: 1000, description: "Distance between grid points, meters." },
      },
      required: ["business_id", "keyword"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    run: async (args, ctx) => {
      await requireBusiness(ctx, args.business_id);
      const keyword = typeof args.keyword === "string" ? args.keyword.trim() : "";
      if (keyword.length < 2) throw new ToolError("keyword est requis.");
      const grid = [3, 5, 7].includes(Number(args.grid_size)) ? Number(args.grid_size) : 3;
      const res = await ctx.callFunction("check-maps-ranking", {
        business_id: args.business_id,
        keyword,
        grid_size: grid,
        spacing_m: clampInt(args.spacing_m, 200, 5000, 1000),
      });
      if (res.status >= 400 || res.data?.success === false) throw functionError("check-maps-ranking", res);
      const points = Array.isArray(res.data?.points) ? res.data.points : [];
      return {
        scan_id: res.data?.scan_id ?? null,
        keyword,
        grid_size: grid,
        average_rank: res.data?.avg_rank ?? null,
        center: res.data?.center ?? null,
        points: points.map((p: any) => ({
          label: p.label,
          lat: p.lat,
          lng: p.lng,
          rank: p.rank_position ?? null,
          top_competitors: Array.isArray(p.competitors) ? p.competitors.slice(0, 3).map((c: any) => c.name) : [],
        })),
        error: res.data?.error ?? null,
      };
    },
  },
  {
    name: "get_ranking_history",
    title: "Historique du classement Maps",
    description: "List previous Google Maps ranking scans (keyword, date, grid, average rank) for a business.",
    inputSchema: {
      type: "object",
      properties: {
        business_id: { type: "string" },
        keyword: { type: "string", description: "Optional exact keyword filter." },
        limit: { type: "integer", minimum: 1, maximum: 30, default: 10 },
      },
      required: ["business_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args, ctx) => {
      await requireBusiness(ctx, args.business_id);
      let q = ctx.db
        .from("maps_rank_scans")
        .select("id, keyword, grid_size, spacing_m, status, created_at, error_message")
        .eq("user_id", ctx.userId)
        .eq("business_id", args.business_id)
        .order("created_at", { ascending: false })
        .limit(clampInt(args.limit, 1, 30, 10));
      if (typeof args.keyword === "string" && args.keyword.trim()) q = q.eq("keyword", args.keyword.trim());
      const { data: scans, error } = await q;
      if (error) throw new ToolError(`Lecture de l'historique impossible : ${error.message}`);
      const ids = (scans ?? []).map((s) => s.id);
      const avg = new Map<string, number | null>();
      if (ids.length) {
        const { data: pts } = await ctx.db
          .from("maps_rank_scan_points")
          .select("scan_id, rank_position")
          .in("scan_id", ids);
        const groups = new Map<string, number[]>();
        for (const p of (pts ?? []) as any[]) {
          const rank = p.rank_position;
          if (typeof rank !== "number") continue;
          groups.set(p.scan_id, [...(groups.get(p.scan_id) ?? []), rank]);
        }
        for (const [id, ranks] of groups) avg.set(id, Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10);
      }
      return {
        scans: (scans ?? []).map((s) => ({
          scan_id: s.id,
          keyword: s.keyword,
          date: s.created_at,
          grid_size: s.grid_size,
          spacing_m: s.spacing_m,
          status: s.status,
          average_rank: avg.get(s.id) ?? null,
          error: s.error_message,
        })),
      };
    },
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC handling
// ---------------------------------------------------------------------------

type JsonRpcMessage = { jsonrpc?: string; id?: string | number | null; method?: string; params?: any };

const rpcResult = (id: JsonRpcMessage["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const rpcError = (id: JsonRpcMessage["id"], code: number, message: string) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

export interface AuthInfo {
  userId: string;
  clientId: string;
}

export async function authenticate(token: string, env: McpEnv): Promise<AuthInfo | null> {
  const client = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: env.fetchImpl ? { fetch: env.fetchImpl } : undefined,
  });
  const { data, error } = await client.auth.getClaims(token);
  const claims = data?.claims as Record<string, unknown> | undefined;
  if (error || !claims) return null;
  if (claims.iss !== issuerFor(env)) return null;
  // Only tokens minted by the OAuth server carry client_id. This rejects
  // first-party browser session JWTs being replayed against the MCP endpoint.
  if (typeof claims.client_id !== "string" || !claims.client_id) return null;
  if (typeof claims.sub !== "string" || !claims.sub) return null;
  return { userId: claims.sub, clientId: claims.client_id };
}

function makeContext(token: string, auth: AuthInfo, env: McpEnv): ToolContext {
  const doFetch = env.fetchImpl ?? fetch;
  const db = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` }, ...(env.fetchImpl ? { fetch: env.fetchImpl } : {}) },
  });
  return {
    db,
    userId: auth.userId,
    callFunction: async (name, body) => {
      const res = await doFetch(`${env.supabaseUrl}/functions/v1/${name}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: env.supabaseKey,
          "Content-Type": "application/json",
          "x-client-info": "reviewsai-mcp/1.0",
        },
        body: JSON.stringify(body),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      return { status: res.status, data };
    },
  };
}

async function handleMessage(msg: JsonRpcMessage, getCtx: () => ToolContext) {
  const { id, method, params } = msg;
  const isNotification = id === undefined;
  if (msg.jsonrpc !== "2.0" || typeof method !== "string") {
    return isNotification ? null : rpcError(id, -32600, "Invalid Request");
  }
  if (isNotification) return null; // notifications/initialized, cancelled, ...

  switch (method) {
    case "initialize": {
      const requested = params?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : SUPPORTED_PROTOCOL_VERSIONS[0];
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "ReviewsAI manages Google Business Profile reviews. Typical flow: list_businesses → list_reviews (status=unanswered) → generate_review_reply → show the draft to the user → publish_review_reply only after explicit approval. Replies published on Google are public.",
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
          name,
          title,
          description,
          inputSchema,
          annotations: { title, ...annotations },
        })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const result = await tool.run((params?.arguments ?? {}) as Record<string, any>, getCtx());
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
          isError: false,
        });
      } catch (e) {
        const message = e instanceof ToolError ? e.message : "Erreur interne ReviewsAI. Réessayez plus tard.";
        if (!(e instanceof ToolError)) console.error("[mcp] tool failure", tool.name, e);
        return rpcResult(id, { content: [{ type: "text", text: message }], isError: true });
      }
    }
    case "resources/list":
      return rpcResult(id, { resources: [] });
    case "prompts/list":
      return rpcResult(id, { prompts: [] });
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function handleMcpRequest(request: Request, env: McpEnv = readMcpEnv(request)): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (!env.supabaseUrl || !env.supabaseKey) return json({ error: "server_misconfigured" }, 500);

  const authHeader = request.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(authHeader)?.[1]?.trim();
  if (!token) return unauthorized(env, "", "Authentication required");
  const auth = await authenticate(token, env).catch(() => null);
  if (!auth) return unauthorized(env, "invalid_token", "The access token is invalid or expired");

  if (request.method === "GET") {
    // Stateless server: no server-initiated SSE stream.
    return new Response(null, { status: 405, headers: { ...corsHeaders, Allow: "POST, OPTIONS" } });
  }
  if (request.method === "DELETE") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 1_000_000) return json(rpcError(null, -32600, "Payload too large"), 413);
    payload = JSON.parse(raw);
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }

  let ctx: ToolContext | null = null;
  const getCtx = () => (ctx ??= makeContext(token, auth, env));
  const messages = Array.isArray(payload) ? payload : [payload];
  const responses = (await Promise.all(messages.map((m) => handleMessage(m as JsonRpcMessage, getCtx)))).filter(
    (r) => r !== null,
  );
  if (responses.length === 0) return new Response(null, { status: 202, headers: corsHeaders });
  return json(Array.isArray(payload) ? responses : responses[0]);
}
