import { createFileRoute } from "@tanstack/react-router";
import ReviewReplyAIForGBP from "@/pages/ReviewReplyAIForGBP";

const title = "Google Review Response Generator AI | Reply to Reviews Faster";
const description =
  "Generate personalized Google review responses with AI. Reply to Google Business Profile reviews faster, keep a professional brand voice and edit every response before publishing.";
const url = "https://googlereviewai.com/review-reply-ai-google-business-profile";

export const Route = createFileRoute("/review-reply-ai-google-business-profile")({
  ssr: true,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "keywords",
        content:
          "Google review response generator, AI Google review reply, Google review AI, Google Business Profile review replies, review response software",
      },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: "https://googlereviewai.com/landing/review-ai-workflow.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://googlereviewai.com/landing/review-ai-workflow.jpg" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: ReviewReplyAIForGBP,
});
