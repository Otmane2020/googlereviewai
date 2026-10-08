import { createFileRoute } from "@tanstack/react-router";
import Reviews from "@/pages/Reviews";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/reviews")({
  component: () => (
    <DashboardLayout>
      <Reviews />
    </DashboardLayout>
  ),
});
