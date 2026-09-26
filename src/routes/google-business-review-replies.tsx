import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["google-business-review-replies"];
const url = "https://googlereviewai.com/google-business-review-replies";

export const Route = createFileRoute("/google-business-review-replies")({
  ssr: true,
  head: () => ({
    meta: [
      { title: "Google Business Review Replies | Respond to GBP Reviews with AI" },
      { name: "description", content: "Respond to Google Business Profile reviews faster with AI-assisted replies. Build consistent, professional responses for every business location." },
      { name: "keywords", content: "Google Business review replies, Google Business Profile review replies, GBP review responses, reply to Google reviews" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:title", content: "Google Business Review Replies | Respond to GBP Reviews with AI" },
      { property: "og:description", content: "Respond to Google Business Profile reviews faster with AI-assisted replies. Build consistent, professional responses for every business location." },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Google Business Review Replies | Respond to GBP Reviews with AI" },
      { name: "twitter:description", content: "Respond to Google Business Profile reviews faster with AI-assisted replies. Build consistent, professional responses for every business location." },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
