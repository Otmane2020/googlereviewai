import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import SeoEngineTest from "@/pages/SeoEngineTest";

export const Route = createFileRoute("/seo-engine-test")({
  component: () => <DashboardLayout><SeoEngineTest /></DashboardLayout>,
});
