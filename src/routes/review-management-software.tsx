import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["review-management-software"];

export const Route = createFileRoute("/review-management-software")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: config.metaTitle },
      { name: "twitter:description", content: config.metaDescription },
      { name: "twitter:image", content: "https://reviewsai.store/og-image.png" },
      { property: "og:title", content: config.metaTitle },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://reviewsai.store/og-image.png" },
      { property: "og:description", content: config.metaDescription },
      { property: "og:url", content: "https://reviewsai.store/review-management-software" },
    ],
    links: [{ rel: "canonical", href: "https://reviewsai.store/review-management-software" }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
