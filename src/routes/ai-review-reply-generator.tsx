import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["ai-review-reply-generator"];

export const Route = createFileRoute("/ai-review-reply-generator")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://googlereviewai.com/ai-review-reply-generator" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/ai-review-reply-generator" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
