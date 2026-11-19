import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { TOOLS, ReviewsAiToolError, makeReviewsAiContext, readMcpEnv } from "../core";

// Wraps the shared ReviewsAI tool logic (../core.ts) as @lovable.dev/mcp-js tools.
const SCHEMAS: Record<string, Record<string, z.ZodTypeAny>> = {
  list_reviews: {
    business_id: z.string().optional().describe("Restrict to one business (id from list_managed_businesses)."),
    status: z.enum(["unanswered", "answered", "all"]).optional().describe("Reply status on Google (default: all)."),
    min_rating: z.number().int().min(1).max(5).optional(),
    max_rating: z.number().int().min(1).max(5).optional(),
    since: z.string().optional().describe("ISO date YYYY-MM-DD: only reviews posted on or after it."),
    limit: z.number().int().min(1).max(50).optional().describe("Default 20."),
  },
  generate_review_reply: {
    review_id: z.number().int().describe("From list_reviews."),
    language: z.string().optional().describe("Reply language code (fr, en, es…). Defaults to the review's language."),
  },
  publish_review_reply: {
    review_id: z.number().int().describe("From list_reviews."),
    reply_text: z.string().max(4000).optional().describe("Final text approved by the user. Omit to publish the saved draft."),
  },
  get_business_insights: {
    business_id: z.string().optional().describe("Omit to aggregate all active businesses."),
    days: z.number().int().min(7).max(180).optional().describe("Default 30."),
  },
  check_maps_ranking: {
    business_id: z.string(),
    keyword: z.string().min(2).max(120).describe('e.g. "restaurant italien lyon"'),
    grid_size: z.union([z.literal(3), z.literal(5), z.literal(7)]).optional().describe("Grid points per side (default 3)."),
    spacing_m: z.number().int().min(200).max(5000).optional().describe("Meters between grid points (default 1000)."),
  },
  get_ranking_history: {
    business_id: z.string(),
    keyword: z.string().optional().describe("Exact keyword filter."),
    limit: z.number().int().min(1).max(30).optional().describe("Default 10."),
  },
};

function wrap(def: (typeof TOOLS)[number]) {
  return defineTool({
    name: def.name,
    title: def.title,
    description: def.description,
    inputSchema: SCHEMAS[def.name],
    annotations: { destructiveHint: false, idempotentHint: def.annotations.readOnlyHint, ...def.annotations },
    handler: async (args, ctx) => {
      const token = ctx.getToken();
      const userId = ctx.getUserId();
      if (!token || !userId) throw new ToolError("Sign in to ReviewsAI to use this tool.");
      try {
        const result = await def.run(args as Record<string, any>, makeReviewsAiContext(token, userId, readMcpEnv()));
        return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: JSON.parse(JSON.stringify(result)) };
      } catch (e) {
        if (e instanceof ReviewsAiToolError) throw new ToolError(e.message);
        console.error("[mcp] tool failure", def.name, e);
        throw new ToolError("ReviewsAI internal error. Please try again later.");
      }
    },
  });
}

export const reviewsAiTools = TOOLS.map(wrap);
