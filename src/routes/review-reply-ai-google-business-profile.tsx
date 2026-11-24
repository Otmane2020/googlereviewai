import { createFileRoute } from "@tanstack/react-router";
import ReviewReplyAIForGBP from "@/pages/ReviewReplyAIForGBP";
import { jsonLd, REVIEWSAI_ORIGIN } from "@/lib/marketingSeo";

const canonical = REVIEWSAI_ORIGIN + "/review-reply-ai-google-business-profile";
const title = "AI Google Review Reply Chrome Extension | ReviewsAI";
const description = "Write personalized Google Business Profile review replies directly in Chrome. Generate an AI draft, edit it and publish when ready.";
const image = REVIEWSAI_ORIGIN + "/landing/review-ai-workflow.jpg";

export const Route = createFileRoute("/review-reply-ai-google-business-profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: canonical }],
    scripts: [{
      type: "application/ld+json",
      children: jsonLd({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "@id": canonical + "#software",
        name: "Review Reply AI for Google Business Profile",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Google Chrome",
        description,
        url: canonical,
        installUrl: "https://chromewebstore.google.com/detail/business-review-reply-ai/eoegigkpfcmdfgelnbjfijnjofjpaiof",
        image,
        publisher: { "@type": "Organization", name: "ReviewsAI", url: REVIEWSAI_ORIGIN + "/" },
      }),
    }],
  }),
  component: ReviewReplyAIForGBP,
});
