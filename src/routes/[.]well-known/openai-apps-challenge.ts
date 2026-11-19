import { createFileRoute } from "@tanstack/react-router";

// Domain verification for the OpenAI plugin portal. Paste the challenge token
// shown in platform.openai.com/plugins into the OPENAI_APPS_CHALLENGE secret.
export const Route = createFileRoute("/.well-known/openai-apps-challenge")({
  server: {
    handlers: {
      GET: async () => {
        const token = (typeof process !== "undefined" ? process.env.OPENAI_APPS_CHALLENGE : undefined)?.trim();
        if (!token) return new Response("Not configured", { status: 404 });
        return new Response(token, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
