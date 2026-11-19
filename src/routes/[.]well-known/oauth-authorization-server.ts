import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, issuerFor, readMcpEnv } from "@/lib/mcp/server";

// Compatibility mirror of Supabase Auth's RFC 8414 metadata for MCP clients
// that look for it on the resource origin instead of the issuer.
export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => {
        const env = readMcpEnv(request);
        const upstream = `${env.supabaseUrl}/.well-known/oauth-authorization-server/auth/v1`;
        const res = await fetch(upstream, { headers: { Accept: "application/json" } });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
