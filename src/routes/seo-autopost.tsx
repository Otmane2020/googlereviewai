import { createFileRoute } from "@tanstack/react-router";
import SEOAutoPost from "@/pages/SEOAutoPost";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/seo-autopost")({
  component: () => (
    <DashboardLayout>
      <SEOAutoPost />
    </DashboardLayout>
  ),
});
