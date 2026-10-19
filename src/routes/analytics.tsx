import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import Analytics from "@/pages/Analytics";

export const Route = createFileRoute("/analytics")({
  component: () => <DashboardLayout><Analytics /></DashboardLayout>,
});
