import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, protectedResourceMetadata, readMcpEnv } from "@/lib/mcp/server";

// RFC 9728 metadata at the origin root (fallback for clients that do not
// append the resource path).
export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) =>
        Response.json(protectedResourceMetadata(readMcpEnv(request)), {
          headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
        }),
    },
  },
});
