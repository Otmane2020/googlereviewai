import { createFileRoute } from "@tanstack/react-router";
import PasswordAuth from "@/pages/PasswordAuth";

export const Route = createFileRoute("/PW")({
  component: PasswordAuth,
});
