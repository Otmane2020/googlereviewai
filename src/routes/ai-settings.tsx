import { createFileRoute } from "@tanstack/react-router";
import AISettings from "@/pages/AISettings";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/ai-settings")({
  component: () => (
    <DashboardLayout>
      <AISettings />
    </DashboardLayout>
  ),
});
