import { createFileRoute } from "@tanstack/react-router";
import LandingPremium from "@/pages/LandingPremium";

export const Route = createFileRoute("/landing")({
  component: LandingPremium,
});
