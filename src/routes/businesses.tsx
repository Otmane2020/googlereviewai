import { createFileRoute } from "@tanstack/react-router";
import Businesses from "@/pages/Businesses";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/businesses")({
  component: () => (
    <DashboardLayout>
      <Businesses />
    </DashboardLayout>
  ),
});
