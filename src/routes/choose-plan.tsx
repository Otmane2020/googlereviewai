import { createFileRoute } from "@tanstack/react-router";
import ChoosePlan from "@/pages/ChoosePlan";

export const Route = createFileRoute("/choose-plan")({
  component: ChoosePlan,
});
