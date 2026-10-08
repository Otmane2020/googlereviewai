import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health/cloud")({
  server: {
    handlers: {
      GET: async () => {
        const { getCloudHealthResponse } = await import("@/lib/cloud-health.server");
        return getCloudHealthResponse();
      },
    },
  },
});
