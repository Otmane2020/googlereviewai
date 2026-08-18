import { createFileRoute } from "@tanstack/react-router";
import LandingQRGratuit from "@/pages/LandingQRGratuit";

export const Route = createFileRoute("/qr-gratuit")({
  ssr: true,
  component: LandingQRGratuit,
});
