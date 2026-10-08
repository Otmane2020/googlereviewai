import { createFileRoute } from "@tanstack/react-router";
import BoutiqueQRImprime from "@/pages/BoutiqueQRImprime";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/boutique/qr-imprime")({
  component: () => (
    <DashboardLayout>
      <BoutiqueQRImprime />
    </DashboardLayout>
  ),
});
