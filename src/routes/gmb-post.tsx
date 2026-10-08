import { createFileRoute } from "@tanstack/react-router";
import GmbPost from "@/pages/GmbPost";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/gmb-post")({
  component: () => (
    <DashboardLayout>
      <GmbPost />
    </DashboardLayout>
  ),
});
