import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["ai-google-review-reply"];
const url = "https://googlereviewai.com/ai-google-review-reply";

export const Route = createFileRoute("/ai-google-review-reply")({
  ssr: true,
  head: () => ({
    meta: [
      { title: "AI Google Review Reply | Write Better Review Responses Faster" },
      { name: "description", content: "Use AI to write personalized Google review replies faster. Respond to positive and negative reviews with consistent, professional, on-brand answers." },
      { name: "keywords", content: "AI Google review reply, Google review AI, AI review responses, reply to Google reviews, Google Business Profile replies" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:title", content: "AI Google Review Reply | Write Better Review Responses Faster" },
      { property: "og:description", content: "Use AI to write personalized Google review replies faster. Respond to positive and negative reviews with consistent, professional, on-brand answers." },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AI Google Review Reply | Write Better Review Responses Faster" },
      { name: "twitter:description", content: "Use AI to write personalized Google review replies faster. Respond to positive and negative reviews with consistent, professional, on-brand answers." },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
