import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runReviewsAiTool } from "../reviewsai-tool";

export default defineTool({
  name: "list_reviews",
  title: "Lister les avis Google",
  description: "List Google reviews for the user's businesses, newest first. Filter by business, reply status (unanswered = no reply published on Google yet), star rating range and date. Returns review_id values used by generate_review_reply and publish_review_reply.",
  inputSchema: {
    business_id: z.string().optional().describe("Restrict to one business (id from list_managed_businesses)."),
    status: z.enum(["unanswered", "answered", "all"]).optional().describe("Reply status on Google (default: all)."),
    min_rating: z.number().int().min(1).max(5).optional(),
    max_rating: z.number().int().min(1).max(5).optional(),
    since: z.string().optional().describe("ISO date YYYY-MM-DD: only reviews posted on or after it."),
    limit: z.number().int().min(1).max(50).optional().describe("Default 20."),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: (args, ctx) => runReviewsAiTool("list_reviews", args, ctx),
});
