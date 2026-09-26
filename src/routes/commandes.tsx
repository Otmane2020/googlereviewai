import { createFileRoute } from "@tanstack/react-router";
import Commandes from "@/pages/Commandes";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/commandes")({
  component: () => (
    <DashboardLayout>
      <Commandes />
    </DashboardLayout>
  ),
});
