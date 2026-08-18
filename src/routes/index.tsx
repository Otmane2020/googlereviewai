import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  ssr: true,
  head: () => ({
    meta: [
      { title: "Google Review AI – AI Review Replies & Local SEO" },
      {
        name: "description",
        content:
          "Google Review AI automatically replies to Google reviews, tracks local rankings and improves your visibility across Google, ChatGPT, Gemini and Perplexity.",
      },
    ],
    links: [{ rel: "canonical", href: "https://googlereviewai.com/" }],
  }),
  component: Index,
});
