import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/settings")({
  component: () => (
    <DashboardLayout>
      <Settings />
    </DashboardLayout>
  ),
});
