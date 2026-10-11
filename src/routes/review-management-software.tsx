import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["review-management-software"];

export const Route = createFileRoute("/review-management-software")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://googlereviewai.com/review-management-software" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/review-management-software" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
