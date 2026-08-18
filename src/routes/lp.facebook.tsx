import { createFileRoute } from "@tanstack/react-router";
import LandingFacebook from "@/pages/LandingFacebook";

export const Route = createFileRoute("/lp/facebook")({
  ssr: true,
  component: LandingFacebook,
});
