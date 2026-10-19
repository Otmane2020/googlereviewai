import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import AIVisibility from "@/pages/AIVisibility";
export const Route = createFileRoute("/ai-visibility")({
 component: () => <DashboardLayout><AIVisibility /></DashboardLayout>,
});
