import { createFileRoute } from "@tanstack/react-router";
import BoutiqueNFC from "@/pages/BoutiqueNFC";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/boutique/nfc")({
  component: () => (
    <DashboardLayout>
      <BoutiqueNFC />
    </DashboardLayout>
  ),
});
