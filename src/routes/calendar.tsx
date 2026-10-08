import { createFileRoute } from "@tanstack/react-router";
import Calendar from "@/pages/Calendar";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/calendar")({
  component: () => (
    <DashboardLayout>
      <Calendar />
    </DashboardLayout>
  ),
});
