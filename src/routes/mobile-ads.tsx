import { createFileRoute } from "@tanstack/react-router";
import MobileAds from "@/pages/MobileAds";

export const Route = createFileRoute("/mobile-ads")({
  component: MobileAds,
});
