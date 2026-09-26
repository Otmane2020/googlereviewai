import { createFileRoute } from "@tanstack/react-router";
import AvisAIRestaurant from "@/pages/AvisAIRestaurant";

export const Route = createFileRoute("/avis-ai-restaurant")({
  ssr: true,
  component: AvisAIRestaurant,
});
