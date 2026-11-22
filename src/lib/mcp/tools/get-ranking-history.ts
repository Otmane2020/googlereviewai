import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runReviewsAiTool } from "../reviewsai-tool";

export default defineTool({
  name: "get_ranking_history",
  title: "Historique du classement Maps",
  description: "List previous Google Maps ranking scans (keyword, date, grid, average rank) for a business.",
  inputSchema: {
    business_id: z.string(),
    keyword: z.string().optional().describe("Exact keyword filter."),
    limit: z.number().int().min(1).max(30).optional().describe("Default 10."),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: (args, ctx) => runReviewsAiTool("get_ranking_history", args, ctx),
});
