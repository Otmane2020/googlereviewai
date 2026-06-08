import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GELATO_API_KEY = Deno.env.get("GELATO_API_KEY");
// User can override default product UID via secret.
// Default = A4 horizontal flyer, 250gsm coated silk, glossy protection (verified available via Gelato API).
const GELATO_PRODUCT_UID =
  Deno.env.get("GELATO_PRODUCT_UID") ??
  "cards_pf_a4_pt_250-gsm-coated-silk_cl_4-0_ct_glossy-protection_hor";

interface Recipient {
  firstName: string;
  lastName?: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postCode: string;
  country: string; // ISO2, e.g. FR
  email?: string;
  phone?: string;
}

interface ReqBody {
  fileUrl: string;
  recipient: Recipient;
  businessName: string;
  quantity?: number;
  orderReferenceId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GELATO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GELATO_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as ReqBody;
    if (!body.fileUrl || !body.recipient || !body.businessName) {
      return new Response(
        JSON.stringify({ error: "Missing fileUrl, recipient, or businessName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const r = body.recipient;
    const requiredFields = ["firstName", "addressLine1", "city", "postCode", "country"];
    for (const f of requiredFields) {
      if (!(r as any)[f]) {
        return new Response(
          JSON.stringify({ error: `Missing recipient field: ${f}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const orderReferenceId =
      body.orderReferenceId ?? `ranki-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const orderPayload = {
      orderType: "order",
      orderReferenceId,
      customerReferenceId: `ranki-${body.businessName.slice(0, 40)}`,
      currency: "EUR",
      items: [
        {
          itemReferenceId: orderReferenceId,
          productUid: GELATO_PRODUCT_UID,
          files: [{ type: "default", url: body.fileUrl }],
          quantity: body.quantity ?? 1,
        },
      ],
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
      headers: {
        "X-API-KEY": GELATO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await gelatoRes.json().catch(() => null);
    if (!gelatoRes.ok) {
      console.error("Gelato error", gelatoRes.status, data);
      return new Response(
        JSON.stringify({
          error: "Gelato order failed",
          status: gelatoRes.status,
          details: data,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: data?.id,
        orderReferenceId,
        gelato: data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("gelato-print-ship error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
