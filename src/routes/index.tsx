import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

const title = "Google Review AI | AI Google Review Replies & Local SEO";
const description =
  "AI Google review response software for businesses. Generate and automate personalized Google review replies, manage your Google Business Profile, track local rankings and improve visibility in Google and AI search.";

export const Route = createFileRoute("/")({
  ssr: true,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "keywords",
        content:
          "Google review AI, AI Google review reply, Google review response generator, Google Business Profile review management, AI review responses, local SEO software",
      },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://googlereviewai.com/" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: "https://googlereviewai.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: "https://googlereviewai.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/" }],
  }),
  component: Index,
});
