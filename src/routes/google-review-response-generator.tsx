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
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://googlereviewai.com/google-review-response-generator" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/google-review-response-generator" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
