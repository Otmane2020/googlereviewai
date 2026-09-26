import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  ),
});
