import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GELATO_API_KEY = Deno.env.get("GELATO_API_KEY");
const GELATO_PRODUCT_UID =
  Deno.env.get("GELATO_PRODUCT_UID") ??
  "cards_pf_a4_pt_250-gsm-coated-silk_cl_4-0_ct_glossy-protection_hor";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Recipient {
  firstName: string;
  lastName?: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postCode: string;
  country: string;
  email?: string;
  phone?: string;
}

interface ReqItem {
  fileUrl: string;
  productUid: string;
  quantity?: number;
}

interface ReqBody {
  fileUrl?: string;           // legacy single-file path
  items?: ReqItem[];          // new multi-product path
  recipient: Recipient;
  businessName: string;
  placeId?: string;
  address?: string;
  quantity?: number;
  orderReferenceId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GELATO_API_KEY) {
      return new Response(JSON.stringify({ error: "GELATO_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    let userId: string | null = null;
    if (token) {
      const sb = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data } = await sb.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const body = (await req.json()) as ReqBody;
    if ((!body.fileUrl && !body.items?.length) || !body.recipient || !body.businessName) {
      return new Response(JSON.stringify({ error: "Missing items/fileUrl, recipient, or businessName" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = body.recipient;
    for (const f of ["firstName", "addressLine1", "city", "postCode", "country"]) {
      if (!(r as any)[f]) {
        return new Response(JSON.stringify({ error: `Missing recipient field: ${f}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const orderReferenceId =
      body.orderReferenceId ?? `ranki-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const items = (body.items?.length ? body.items : [{
      fileUrl: body.fileUrl!, productUid: GELATO_PRODUCT_UID, quantity: body.quantity ?? 1,
    }]).map((it, idx) => ({
      itemReferenceId: `${orderReferenceId}-${idx + 1}`,
      productUid: it.productUid,
      files: [{ type: "default", url: it.fileUrl }],
      quantity: it.quantity ?? 1,
    }));

    const orderPayload = {
      orderType: "order",
      orderReferenceId,
      customerReferenceId: `ranki-${body.businessName.slice(0, 40)}`,
      currency: "EUR",
      items,
      shippingAddress: {
        firstName: r.firstName,
        lastName: r.lastName ?? r.firstName,
        companyName: r.companyName ?? body.businessName,
        addressLine1: r.addressLine1,
        addressLine2: r.addressLine2 ?? "",
        city: r.city,
        postCode: r.postCode,
        country: r.country.toUpperCase(),
        email: r.email ?? "noreply@ranki.ai",
        phone: r.phone ?? "+33000000000",
      },
    };

    const gelatoRes = await fetch("https://order.gelatoapis.com/v4/orders", {
      method: "POST",
      headers: { "X-API-KEY": GELATO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const data = await gelatoRes.json().catch(() => null);
    if (!gelatoRes.ok) {
      console.error("Gelato error", gelatoRes.status, data);
      const msg = data?.message || data?.details?.message || "";
      const code = data?.code || data?.details?.code;
      const needsCompanyInfo = code === "BAD_REQUEST" && /company information/i.test(msg);
      return new Response(JSON.stringify({
        error: needsCompanyInfo
          ? "Ton compte Gelato n'est pas complet. Va sur https://gelato.com/dashboard/settings/company et renseigne les infos société (raison sociale, adresse, TVA), puis réessaie."
          : `Gelato : ${msg || "commande refusée"}`,
        code: needsCompanyInfo ? "GELATO_COMPANY_INFO_INCOMPLETE" : "GELATO_ORDER_FAILED",
        status: gelatoRes.status,
        details: data,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log to DB
    if (userId) {
      const sb = createClient(SUPABASE_URL, SERVICE_KEY);
      const totalCost = data?.shipment?.totalCost ?? data?.receipts?.[0]?.summary?.products
        ?? null;
      await sb.from("print_ship_orders").insert({
        user_id: userId,
        type: "print_ship",
        prospect_place_id: body.placeId ?? null,
        prospect_name: body.businessName,
        prospect_address: body.address ?? `${r.addressLine1}, ${r.postCode} ${r.city}`,
        prospect_city: r.city,
        prospect_country: r.country.toUpperCase(),
        recipient: r,
        file_url: body.fileUrl,
        gelato_order_id: data?.id ?? null,
        gelato_reference_id: orderReferenceId,
        status: data?.fulfillmentStatus ?? data?.orderStatus ?? "created",
        cost: typeof totalCost === "number" ? totalCost : null,
        currency: "EUR",
        raw: data,
      });
    }

    return new Response(JSON.stringify({
      success: true, orderId: data?.id, orderReferenceId, gelato: data,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("gelato-print-ship error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
