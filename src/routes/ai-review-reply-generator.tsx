import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["ai-review-reply-generator"];
const url = "https://googlereviewai.com/ai-review-reply-generator";

export const Route = createFileRoute("/ai-review-reply-generator")({
  ssr: true,
  head: () => ({
    meta: [
      { title: "AI Review Reply Generator | Personalized Customer Review Responses" },
      { name: "description", content: "Generate personalized replies to customer reviews with AI. Create professional responses for positive, negative and mixed feedback in seconds." },
      { name: "keywords", content: "AI review reply generator, AI review response generator, review response AI, customer review reply generator" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:title", content: "AI Review Reply Generator | Personalized Customer Review Responses" },
      { property: "og:description", content: "Generate personalized replies to customer reviews with AI. Create professional responses for positive, negative and mixed feedback in seconds." },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AI Review Reply Generator | Personalized Customer Review Responses" },
      { name: "twitter:description", content: "Generate personalized replies to customer reviews with AI. Create professional responses for positive, negative and mixed feedback in seconds." },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
