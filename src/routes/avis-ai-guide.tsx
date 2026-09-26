import { createFileRoute } from "@tanstack/react-router";
import AvisAIGuide from "@/pages/AvisAIGuide";

export const Route = createFileRoute("/avis-ai-guide")({
  component: AvisAIGuide,
});
