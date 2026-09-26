import { createFileRoute } from "@tanstack/react-router";
import Checklist from "@/pages/Checklist";

export const Route = createFileRoute("/checklist")({
  component: Checklist,
});
