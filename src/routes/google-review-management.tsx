import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["google-review-management"];
const url = "https://googlereviewai.com/google-review-management";

export const Route = createFileRoute("/google-review-management")({
  ssr: true,
  head: () => ({
    meta: [
      { title: "Google Review Management | Manage Replies, Reputation & Local SEO" },
      { name: "description", content: "Manage Google reviews in one workflow. Track unanswered reviews, use AI-assisted replies and maintain a consistent reputation across locations." },
      { name: "keywords", content: "Google review management, review management, Google Business Profile reviews, reputation management software, multi-location reviews" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:title", content: "Google Review Management | Manage Replies, Reputation & Local SEO" },
      { property: "og:description", content: "Manage Google reviews in one workflow. Track unanswered reviews, use AI-assisted replies and maintain a consistent reputation across locations." },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Google Review Management | Manage Replies, Reputation & Local SEO" },
      { name: "twitter:description", content: "Manage Google reviews in one workflow. Track unanswered reviews, use AI-assisted replies and maintain a consistent reputation across locations." },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
