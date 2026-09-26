import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["review-management-software"];
const url = "https://googlereviewai.com/review-management-software";

export const Route = createFileRoute("/review-management-software")({
  ssr: true,
  head: () => ({
    meta: [
      { title: "Review Management Software | AI Review Replies & Local Reputation" },
      { name: "description", content: "Review management software for local businesses and multi-location teams. Monitor customer reviews, generate AI replies and improve response workflows." },
      { name: "keywords", content: "review management software, reputation management software, AI review software, Google review management software" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:title", content: "Review Management Software | AI Review Replies & Local Reputation" },
      { property: "og:description", content: "Review management software for local businesses and multi-location teams. Monitor customer reviews, generate AI replies and improve response workflows." },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Review Management Software | AI Review Replies & Local Reputation" },
      { name: "twitter:description", content: "Review management software for local businesses and multi-location teams. Monitor customer reviews, generate AI replies and improve response workflows." },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
