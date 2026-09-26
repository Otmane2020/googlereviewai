import { createFileRoute } from "@tanstack/react-router";
import ReviewReplyAIForGBP from "@/pages/ReviewReplyAIForGBP";

export const Route = createFileRoute("/review-reply-ai-google-business-profile")({
  component: ReviewReplyAIForGBP,
});
