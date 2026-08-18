import { createFileRoute } from "@tanstack/react-router";
import LocalAEO from "@/pages/LocalAEO";

export const Route = createFileRoute("/local-aeo")({
  ssr: true,
  component: LocalAEO,
});
