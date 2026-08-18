import { createFileRoute } from "@tanstack/react-router";
import AvisAIHotel from "@/pages/AvisAIHotel";

export const Route = createFileRoute("/avis-ai-hotel")({
  ssr: true,
  component: AvisAIHotel,
});
