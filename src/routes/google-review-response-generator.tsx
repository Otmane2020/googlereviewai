import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["google-review-response-generator"];

export const Route = createFileRoute("/google-review-response-generator")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://reviewsai.store/og-image.png" },
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://reviewsai.store/google-review-response-generator" },
    ],
    links: [{ rel: "canonical", href: "https://reviewsai.store/google-review-response-generator" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
