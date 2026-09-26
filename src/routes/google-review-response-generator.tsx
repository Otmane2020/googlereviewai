import { createFileRoute } from "@tanstack/react-router";
import TransactionalSeoPage from "@/pages/TransactionalSeoPage";
import { transactionalSeoPages } from "@/data/transactionalSeoPages";

const config = transactionalSeoPages["google-review-response-generator"];
const url = "https://googlereviewai.com/google-review-response-generator";

export const Route = createFileRoute("/google-review-response-generator")({
  ssr: true,
  head: () => ({
    meta: [
      { title: "Google Review Response Generator | Generate Replies with AI" },
      { name: "description", content: "Generate professional Google review responses in seconds. Create tailored replies for positive, neutral and negative customer reviews with AI." },
      { name: "keywords", content: "Google review response generator, review reply generator, AI Google review response, Google review response AI" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:title", content: "Google Review Response Generator | Generate Replies with AI" },
      { property: "og:description", content: "Generate professional Google review responses in seconds. Create tailored replies for positive, neutral and negative customer reviews with AI." },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Google Review Response Generator | Generate Replies with AI" },
      { name: "twitter:description", content: "Generate professional Google review responses in seconds. Create tailored replies for positive, neutral and negative customer reviews with AI." },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: () => <TransactionalSeoPage config={config} />,
});
