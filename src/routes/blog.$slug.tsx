import { createFileRoute } from "@tanstack/react-router";
import BlogArticle from "@/pages/BlogArticle";

export const Route = createFileRoute("/blog/$slug")({
  ssr: true,
  component: BlogArticle,
});
