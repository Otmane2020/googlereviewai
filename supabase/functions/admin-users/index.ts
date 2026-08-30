import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
const ADMIN_EMAIL = "benyahya.otmane@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const auth = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error } = await auth.auth.getUser();
    if (error || !user || user.email !== ADMIN_EMAIL) return json({ error: "Forbidden" }, 403);
    const admin = createClient(url, service);

    if (req.method === "GET") {
      const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return json({ error: listError.message }, 500);
      const ids = (users.users || []).map((u) => u.id);
      const { data: profiles } = ids.length ? await admin.from("profiles").select("id,full_name,plan_name,subscription_status,credits,created_at").in("id", ids) : { data: [] };
      const byId = new Map((profiles || []).map((p) => [p.id, p]));
      return json({ users: (users.users || []).map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, ...byId.get(u.id) })) });
    }

    if (req.method === "POST") {
      const { userId } = await req.json();
      if (!userId || userId === user.id) return json({ error: "Invalid target user" }, 400);
      const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
      if (targetError || !target.user?.email) return json({ error: "User not found" }, 404);
      const { data: link, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: target.user.email,
        options: { redirectTo: new URL("/", req.headers.get("origin") || url).toString() },
      });
      if (linkError || !link.properties?.hashed_token) return json({ error: linkError?.message || "Could not create session link" }, 500);
      return json({ token_hash: link.properties.hashed_token, email: target.user.email });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("[admin-users]", e);
    return json({ error: "Internal server error" }, 500);
  }
});
