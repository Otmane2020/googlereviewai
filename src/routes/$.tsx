import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  ssr: false,
  pendingComponent: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-9 w-9 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  ),
  component: lazyRouteComponent(() => import("@/migration/LegacyClientRoutes")),
});
