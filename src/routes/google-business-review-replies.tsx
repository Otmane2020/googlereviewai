import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["google-business-review-replies"];

export const Route = createFileRoute("/google-business-review-replies")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://googlereviewai.com/google-business-review-replies" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/google-business-review-replies" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
