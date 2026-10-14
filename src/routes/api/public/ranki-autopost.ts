import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, authorization, apikey, x-api-key, x-ranki-webhook-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/public/ranki-autopost")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 200, headers: cors }),
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 1_000_000) {
          return json({ ok: false, error: "Payload too large" }, 413);
        }

        const supabaseUrl = process.env["SUPABASE_URL"];
        if (!supabaseUrl) {
          return json({ ok: false, error: "Supabase runtime is not configured" }, 500);
        }

        // Keep this application route as a thin proxy so there is only one
        // implementation of the Ranki -> Google publication contract.
        const headers = new Headers({ "Content-Type": "application/json" });
        for (const name of ["authorization", "x-api-key", "x-ranki-webhook-secret"]) {
          const value = request.headers.get(name);
          if (value) headers.set(name, value);
        }

        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/ranki-autopost`, {
            method: "POST",
            headers,
            body: raw,
          });
          const responseBody = await response.text();
          return new Response(responseBody, {
            status: response.status,
            headers: {
              ...cors,
              "Content-Type": response.headers.get("content-type") || "application/json",
            },
          });
        } catch (error) {
          console.error("[ranki-autopost proxy] Edge Function request failed", error);
          return json({ ok: false, error: "Ranki publication service unavailable" }, 502);
        }
      },
    },
  },
});
