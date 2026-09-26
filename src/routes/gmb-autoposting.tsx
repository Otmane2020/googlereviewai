import { createFileRoute } from "@tanstack/react-router";
import GmbAutopostingGuide from "@/pages/GmbAutopostingGuide";

export const Route = createFileRoute("/gmb-autoposting")({
  ssr: true,
  component: GmbAutopostingGuide,
});
