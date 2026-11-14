import { createFileRoute } from "@tanstack/react-router";

const BODY = '[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"store.reviewsai.android","sha256_cert_fingerprints":["08:48:C5:2E:B2:05:CE:81:24:6B:D2:DE:F8:E2:B9:52:F1:49:E7:CF:24:79:A0:46:F1:52:0B:8A:28:FE:BC:2D"]}}]';

export const Route = createFileRoute("/.well-known/assetlinks.json")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        }),
    },
  },
});
