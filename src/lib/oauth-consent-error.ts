// Classifies Supabase OAuth consent errors so the consent page only offers
// "try again" when retrying can actually work.
export type ConsentFailure = "expired" | "session" | "retry";

const expiredCodes = new Set([
  "oauth_authorization_not_found",
  "oauth_authorization_expired",
  "flow_state_not_found",
  "flow_state_expired",
  "bad_oauth_state",
]);
const sessionCodes = new Set(["session_not_found", "session_expired", "bad_jwt", "no_authorization", "user_not_found"]);

export function classifyConsentError(error: unknown): ConsentFailure {
  const e = (error ?? {}) as { code?: unknown; error_code?: unknown; status?: unknown; message?: unknown };
  const code = String(e.code ?? e.error_code ?? "").toLowerCase();
  const message = String(e.message ?? "").toLowerCase();
  if (expiredCodes.has(code) || e.status === 404 || /authorization (not found|expired)|already (been )?(approved|denied|used)/.test(message)) return "expired";
  if (sessionCodes.has(code) || e.status === 401 || /jwt|session/.test(message)) return "session";
  return "retry";
}
