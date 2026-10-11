import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["google-review-management"];

export const Route = createFileRoute("/google-review-management")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://googlereviewai.com/google-review-management" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/google-review-management" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
