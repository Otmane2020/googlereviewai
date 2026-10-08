import { createFileRoute } from "@tanstack/react-router";
import AdminOrders from "@/pages/AdminOrders";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});
