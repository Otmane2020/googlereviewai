import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/shop/checkout")({
  ssr: false,
  component: lazyRouteComponent(() => import("@/pages/ShopCheckout")),
});
