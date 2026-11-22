import { ToolError } from "@lovable.dev/mcp-js";
import { TOOLS, ReviewsAiToolError, makeReviewsAiContext, readMcpEnv } from "./core";

// Shared handler for the ReviewsAI tools. Each tool is declared with literal
// metadata in its own file under ./tools/ (the @lovable.dev/mcp-js build only
// picks up tools declared that way) and delegates its work here.
export async function runReviewsAiTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { getToken(): string | undefined | null; getUserId(): string | undefined | null },
) {
  const def = TOOLS.find((t) => t.name === name);
  if (!def) throw new ToolError(`Unknown ReviewsAI tool: ${name}`);
  const token = ctx.getToken();
  const userId = ctx.getUserId();
  if (!token || !userId) throw new ToolError("Sign in to ReviewsAI to use this tool.");
  try {
    const result = await def.run(args as Record<string, any>, makeReviewsAiContext(token, userId, readMcpEnv()));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
      structuredContent: JSON.parse(JSON.stringify(result)) as Record<string, unknown>,
    };
  } catch (e) {
    if (e instanceof ReviewsAiToolError) throw new ToolError(e.message);
    console.error("[mcp] tool failure", name, e);
    throw new ToolError("ReviewsAI internal error. Please try again later.");
  }
}
