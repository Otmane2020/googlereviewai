import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["ai-google-review-reply"];

export const Route = createFileRoute("/ai-google-review-reply")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://googlereviewai.com/ai-google-review-reply" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/ai-google-review-reply" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
