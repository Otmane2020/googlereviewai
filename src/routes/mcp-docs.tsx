import { createFileRoute } from "@tanstack/react-router";
import McpDocs from "@/pages/McpDocs";

export const Route = createFileRoute("/mcp-docs")({
  component: McpDocs,
});
