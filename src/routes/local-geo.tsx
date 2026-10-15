import { createFileRoute } from "@tanstack/react-router";
import LocalAEO from "@/pages/LocalAEO";

// GEO marketing URL; legacy /local-aeo remains available for existing links.
export const Route = createFileRoute("/local-geo")({
  component: LocalAEO,
});
