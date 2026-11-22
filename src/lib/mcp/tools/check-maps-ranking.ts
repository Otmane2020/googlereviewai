import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runReviewsAiTool } from "../reviewsai-tool";

export default defineTool({
  name: "check_maps_ranking",
  title: "Mesurer le classement Google Maps",
  description: "Run a new local ranking scan: searches Google Maps for `keyword` on a grid of points around the business and returns its position at each point plus the average rank. Takes up to a minute and uses paid search quota; prefer get_ranking_history if a recent scan exists.",
  inputSchema: {
    business_id: z.string(),
    keyword: z.string().min(2).max(120).describe('e.g. "restaurant italien lyon"'),
    grid_size: z.union([z.literal(3), z.literal(5), z.literal(7)]).optional().describe("Grid points per side (default 3)."),
    spacing_m: z.number().int().min(200).max(5000).optional().describe("Meters between grid points (default 1000)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: (args, ctx) => runReviewsAiTool("check_maps_ranking", args, ctx),
});
