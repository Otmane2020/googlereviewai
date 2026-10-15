import { createFileRoute } from "@tanstack/react-router";
import AEORank from "@/pages/AEORank";
import { DashboardLayout } from "@/components/DashboardLayout";

// Public GEO URL; /aeo-rank stays accessible for old bookmarks and notification links.
export const Route = createFileRoute("/geo-rank")({
  component: () => (
    <DashboardLayout>
      <AEORank />
    </DashboardLayout>
  ),
});
