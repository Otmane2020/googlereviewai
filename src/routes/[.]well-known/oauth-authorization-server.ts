import { createFileRoute } from "@tanstack/react-router";
import { readMcpEnv } from "@/lib/mcp/core";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };

// Compatibility mirror of Supabase Auth's RFC 8414 metadata for MCP clients
// that look for it on the resource origin instead of the issuer.
export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async () => {
        const { supabaseUrl } = readMcpEnv();
        const res = await fetch(`${supabaseUrl}/.well-known/oauth-authorization-server/auth/v1`, {
          headers: { Accept: "application/json" },
        });
        return new Response(await res.text(), {
          status: res.status,
          headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
