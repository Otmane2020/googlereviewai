import { createFileRoute } from "@tanstack/react-router";
import ShopCheckout from "@/pages/ShopCheckout";

export const Route = createFileRoute("/shop/checkout")({
  component: ShopCheckout,
});
