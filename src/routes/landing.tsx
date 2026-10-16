import { createFileRoute } from "@tanstack/react-router";
import LandingPremium from "@/pages/LandingPremium";

// Campaign landing is allowed to be crawled so its canonical/noindex directives
// can be read; the main home page is the preferred organic destination.
export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,follow" }],
    links: [{ rel: "canonical", href: "https://reviewsai.store/" }],
  }),
  component: LandingPremium,
});
