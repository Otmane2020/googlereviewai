import { createFileRoute } from "@tanstack/react-router";
import Restaurants from "@/pages/Restaurants";

export const Route = createFileRoute("/restaurants")({
  ssr: true,
  component: Restaurants,
});
