import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GELATO_API_KEY = Deno.env.get("GELATO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData } = await sb.auth.getUser(token);
    const userId = userData.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId } = await req.json() as { orderId?: string };

    // Fetch orders to refresh: a single one if orderId provided, else all pending of this user
    const q = sb.from("print_ship_orders").select("*").eq("user_id", userId);
    const { data: rows } = orderId
      ? await q.eq("id", orderId)
      : await q.not("gelato_order_id", "is", null).in("status", ["created", "passed", "printed", "in_production", "in_transit", "shipped"]);

    const updates: any[] = [];
    for (const row of rows ?? []) {
      if (!row.gelato_order_id) continue;
      try {
        const res = await fetch(`https://order.gelatoapis.com/v4/orders/${row.gelato_order_id}`, {
          headers: { "X-API-KEY": GELATO_API_KEY },
        });
        if (!res.ok) continue;
        const o = await res.json();
        const tracking = o?.shipment?.trackingUrl ?? o?.items?.[0]?.fulfillments?.[0]?.trackingUrl ?? null;
        const trackingCode = o?.shipment?.trackingCode ?? o?.items?.[0]?.fulfillments?.[0]?.trackingCode ?? null;
        const status = o?.fulfillmentStatus ?? o?.orderStatus ?? row.status;
        await sb.from("print_ship_orders").update({
          status,
          tracking_url: tracking,
          tracking_code: trackingCode,
          last_status_check: new Date().toISOString(),
          raw: o,
        }).eq("id", row.id);
        updates.push({ id: row.id, status, tracking });
      } catch (e) {
        console.error("status fetch failed", row.gelato_order_id, e);
      }
    }

    return new Response(JSON.stringify({ updated: updates.length, updates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
