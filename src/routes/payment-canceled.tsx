import { createFileRoute } from "@tanstack/react-router";
import PaymentCanceled from "@/pages/PaymentCanceled";

export const Route = createFileRoute("/payment-canceled")({
  component: PaymentCanceled,
});
