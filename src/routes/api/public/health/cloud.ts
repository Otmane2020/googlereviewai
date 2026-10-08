import { createFileRoute } from "@tanstack/react-router";

// UptimeRobot checks this public GET route. It uses the existing Lovable Cloud
// database injected by the platform; there is no external Supabase connection.
async function checkCloudHealth(): Promise<Response> {
  const startedAt = Date.now();
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
    // Timeouts, lost database access and missing Cloud credentials are KO.
  }
  return new Response(
    JSON.stringify({
      ok: healthy,
      status: healthy ? "OK" : "KO",
      latencyMs: Date.now() - startedAt,
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

export const Route = createFileRoute("/api/public/health/cloud")({
  server: {
    handlers: {
      GET: () => checkCloudHealth(),
    },
  },
});
