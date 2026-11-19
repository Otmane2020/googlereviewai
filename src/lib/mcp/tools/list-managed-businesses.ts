import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_managed_businesses",
  title: "List managed businesses",
  description: "List active businesses managed by the connected ReviewsAI account, with their name, address, stored rating and review count.",
  inputSchema: {
    offset: z.number().int().min(0).max(1_000_000).optional().describe("Number of businesses to skip for pagination (default: 0)."),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ offset = 0 }, ctx) => {
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Sign in to ReviewsAI to use this tool.");
    const pageSize = 25;
    const { data, error } = await supabaseForUser(ctx)
      .from("businesses")
      .select("id, name, address, rating, total_reviews")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + pageSize)
      .abortSignal(ctx.signal);
    if (error) throw new ToolError("Could not load your businesses. Please try again.");
    const page = {
      businesses: data.slice(0, pageSize).map(({ id, name, address, rating, total_reviews }) => ({
        id, name, address, rating, reviewCount: total_reviews,
      })),
      nextOffset: data.length > pageSize ? offset + pageSize : null,
    };
    return { content: [{ type: "text", text: JSON.stringify(page) }], structuredContent: page };
  },
});
