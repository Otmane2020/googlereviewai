import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runReviewsAiTool } from "../reviewsai-tool";

export default defineTool({
  name: "publish_review_reply",
  title: "Publier la réponse sur Google",
  description: "Publish a reply publicly on Google for one review. If `reply_text` is given it replaces the saved draft first; otherwise the saved draft (from generate_review_reply) is published. This is public and visible to everyone: only call it after the user has explicitly approved the exact text.",
  inputSchema: {
    review_id: z.number().int().describe("From list_reviews."),
    reply_text: z.string().max(4000).optional().describe("Final text approved by the user. Omit to publish the saved draft."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  handler: (args, ctx) => runReviewsAiTool("publish_review_reply", args, ctx),
});
