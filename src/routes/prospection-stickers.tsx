import { createFileRoute } from "@tanstack/react-router";
import ProspectionStickers from "@/pages/ProspectionStickers";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/prospection-stickers")({
  component: () => (
    <DashboardLayout>
      <ProspectionStickers />
    </DashboardLayout>
  ),
});
