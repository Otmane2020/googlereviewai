import { createFileRoute } from "@tanstack/react-router";
import AEORank from "@/pages/AEORank";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/aeo-rank")({
  component: () => (
    <DashboardLayout>
      <AEORank />
    </DashboardLayout>
  ),
});
