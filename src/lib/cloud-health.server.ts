/**
 * Native Lovable Cloud liveness check shared by the HTTP entry and the API route.
 * Uses the existing platform-provided database credentials only on the server.
 */
export async function getCloudHealthResponse(): Promise<Response> {
  const start = Date.now();
  let healthy = false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("visitor_analytics")
      .select("id")
      .limit(1)
      .abortSignal(AbortSignal.timeout(8000));
    healthy = !error;
  } catch {
    // Missing credentials, database outages and timeouts are reported as KO.
  }
  return new Response(
    JSON.stringify({
      ok: healthy,
      status: healthy ? "OK" : "KO",
      latencyMs: Date.now() - start,
    }),
    {
      status: healthy ? 200 : 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
