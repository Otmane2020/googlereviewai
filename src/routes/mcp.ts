import { createFileRoute } from "@tanstack/react-router";
import { handleMcpRequest } from "@/lib/mcp/server";

// Remote MCP endpoint (Streamable HTTP) used by Claude and ChatGPT connectors.
const handle = async ({ request }: { request: Request }) => handleMcpRequest(request);

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: { GET: handle, POST: handle, DELETE: handle, OPTIONS: handle },
  },
});
