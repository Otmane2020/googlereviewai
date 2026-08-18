import { createFileRoute } from "@tanstack/react-router";
import ShopProduct from "@/pages/ShopProduct";

export const Route = createFileRoute("/shop/$slug")({
  ssr: true,
  component: ShopProduct,
});
