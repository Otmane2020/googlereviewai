import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runReviewsAiTool } from "../reviewsai-tool";

export default defineTool({
  name: "generate_review_reply",
  title: "Générer une réponse IA",
  description: "Draft an AI reply to one review in the business's brand voice and signature (as configured in ReviewsAI). The draft is saved on the review but NOT published. Uses one ReviewsAI credit on plans without unlimited replies. Show the draft to the user before publishing.",
  inputSchema: {
    review_id: z.number().int().describe("From list_reviews."),
    language: z.string().optional().describe("Reply language code (fr, en, es…). Defaults to the review's language."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: (args, ctx) => runReviewsAiTool("generate_review_reply", args, ctx),
});
