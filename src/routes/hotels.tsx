import { createFileRoute } from "@tanstack/react-router";
import Hotels from "@/pages/Hotels";

export const Route = createFileRoute("/hotels")({
  ssr: true,
  component: Hotels,
});
