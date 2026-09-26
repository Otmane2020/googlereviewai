import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/pages/Notifications";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/notifications")({
  component: () => (
    <DashboardLayout>
      <Notifications />
    </DashboardLayout>
  ),
});
