import { createFileRoute } from "@tanstack/react-router";
import Boutique from "@/pages/Boutique";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/boutique/")({
  component: () => (
    <DashboardLayout>
      <Boutique />
    </DashboardLayout>
  ),
});
