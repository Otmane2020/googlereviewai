import { createFileRoute } from "@tanstack/react-router";
import GmbAutopostingGuide from "@/pages/GmbAutopostingGuide";

export const Route = createFileRoute("/gmb-autoposting")({
  component: GmbAutopostingGuide,
});
