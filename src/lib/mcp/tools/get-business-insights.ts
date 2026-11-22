import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runReviewsAiTool } from "../reviewsai-tool";

export default defineTool({
  name: "get_business_insights",
  title: "Statistiques Google Business",
  description: "Get Google Business Profile performance for the last N days: profile views (Search / Maps), calls, website clicks, direction requests. Omit business_id to aggregate all active businesses.",
  inputSchema: {
    business_id: z.string().optional().describe("Omit to aggregate all active businesses."),
    days: z.number().int().min(7).max(180).optional().describe("Default 30."),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  handler: (args, ctx) => runReviewsAiTool("get_business_insights", args, ctx),
});
