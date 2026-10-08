import { createFileRoute } from "@tanstack/react-router";
import MapsRank from "@/pages/MapsRank";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/maps-rank")({
  component: () => (
    <DashboardLayout>
      <MapsRank />
    </DashboardLayout>
  ),
});
