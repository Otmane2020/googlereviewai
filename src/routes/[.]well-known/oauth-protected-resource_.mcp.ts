import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, protectedResourceMetadata, readMcpEnv } from "@/lib/mcp/server";

// RFC 9728 metadata for the /mcp resource (advertised in WWW-Authenticate).
export const Route = createFileRoute("/.well-known/oauth-protected-resource_/mcp")({
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
