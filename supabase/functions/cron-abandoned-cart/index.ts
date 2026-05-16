import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

type Lang = "fr" | "en";

async function resolveLang(email: string): Promise<Lang> {
  try {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("preferred_language")
      .eq("email", email)
      .maybeSingle();
    return (data as any)?.preferred_language === "en" ? "en" : "fr";
  } catch { return "fr"; }
}

// ─── Email Templates ───────────────────────────────────────────────
function emailTemplate1(name: string, cartSummary: string, lang: Lang = "fr"): string {
  const firstName = name ? name.split(" ")[0] : "";
  const en = lang === "en";
  const T = {
    title: en ? "You forgot something? 🛒" : "Vous avez oublié quelque chose ? 🛒",
    hello: en ? `Hi${firstName ? ` ${firstName}` : ""},` : `Bonjour${firstName ? ` ${firstName}` : ""},`,
    intro: en ? "You were one click away from boosting your Google visibility! Your cart is still waiting:" : "Vous étiez à deux doigts de booster votre visibilité Google ! Votre panier vous attend toujours :",
    push: en ? "The longer you wait, the more your competitors get ahead on Google Maps. Complete your order now!" : "Plus vous attendez, plus vos concurrents prennent de l'avance sur Google Maps. Finalisez votre commande maintenant !",
    cta: en ? "Complete my order →" : "Finaliser ma commande →",
  };
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#ffffff;padding:32px 24px;border-bottom:1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;"><img src="https://ranki.ai/favicon.png" width="32" height="32" alt="Ranki.ai" /></td>
          <td style="vertical-align:middle;padding-left:12px;"><span style="font-family:-apple-system,sans-serif;font-weight:600;font-size:18px;color:#111827;">Ranki.ai</span></td>
        </tr>
      </table>
    </div>
    <div style="padding:40px 32px;">
      <h1 style="font-family:-apple-system,sans-serif;color:#111827;font-size:24px;font-weight:600;margin:0 0 24px 0;">${T.title}</h1>
      <p style="font-family:-apple-system,sans-serif;color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px 0;">${T.hello}</p>
      <p style="font-family:-apple-system,sans-serif;color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px 0;">${T.intro}</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">${cartSummary}</div>
      <p style="font-family:-apple-system,sans-serif;color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px 0;">${T.push}</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://ranki.ai/choose-plan" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,sans-serif;font-size:16px;font-weight:600;">${T.cta}</a>
      </div>
    </div>
    <div style="padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-family:-apple-system,sans-serif;color:#9ca3af;font-size:12px;margin:0;">© 2025 Ranki.ai · <a href="https://ranki.ai" style="color:#9ca3af;">ranki.ai</a></p>
    </div>
  </div>
</body>
</html>`;
}

function emailTemplate2(name: string, cartSummary: string, couponCode: string, discountPercent: number): string {
  const firstName = name ? name.split(" ")[0] : "";
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#ffffff;padding:32px 24px;border-bottom:1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;"><img src="https://ranki.ai/favicon.png" width="32" height="32" alt="Ranki.ai" /></td>
          <td style="vertical-align:middle;padding-left:12px;"><span style="font-family:-apple-system,sans-serif;font-weight:600;font-size:18px;color:#111827;">Ranki.ai</span></td>
        </tr>
      </table>
    </div>
    <div style="padding:40px 32px;">
      <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:12px;padding:24px;text-align:center;margin:0 0 32px 0;">
        <p style="font-family:-apple-system,sans-serif;color:#ffffff;font-size:14px;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1px;">Offre exclusive</p>
        <p style="font-family:-apple-system,sans-serif;color:#ffffff;font-size:36px;font-weight:700;margin:0;">-${discountPercent}%</p>
        <p style="font-family:-apple-system,sans-serif;color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0 0;">sur votre premier mois</p>
      </div>
      <h1 style="font-family:-apple-system,sans-serif;color:#111827;font-size:24px;font-weight:600;margin:0 0 24px 0;">
        On ne vous a pas oublié${firstName ? `, ${firstName}` : ""} ! 🎁
      </h1>
      <p style="font-family:-apple-system,sans-serif;color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Votre panier est toujours là, et on a une surprise pour vous : <strong>${discountPercent}% de réduction</strong> avec le code ci-dessous !
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">
        ${cartSummary}
      </div>
      <div style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:8px;padding:16px;text-align:center;margin:24px 0;">
        <p style="font-family:-apple-system,sans-serif;color:#92400e;font-size:12px;margin:0 0 8px 0;text-transform:uppercase;">Code promo</p>
        <p style="font-family:'Courier New',monospace;color:#111827;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;">${couponCode}</p>
        <p style="font-family:-apple-system,sans-serif;color:#92400e;font-size:12px;margin:8px 0 0 0;">⏰ Valable 48h seulement</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://ranki.ai/choose-plan" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,sans-serif;font-size:16px;font-weight:600;">
          Profiter de -${discountPercent}% maintenant →
        </a>
      </div>
    </div>
    <div style="padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-family:-apple-system,sans-serif;color:#9ca3af;font-size:12px;margin:0;">© 2025 Ranki.ai · <a href="https://ranki.ai" style="color:#9ca3af;">ranki.ai</a></p>
    </div>
  </div>
</body>
</html>`;
}

function emailTemplate3(name: string, cartSummary: string, couponCode: string): string {
  const firstName = name ? name.split(" ")[0] : "";
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#ffffff;padding:32px 24px;border-bottom:1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;"><img src="https://ranki.ai/favicon.png" width="32" height="32" alt="Ranki.ai" /></td>
          <td style="vertical-align:middle;padding-left:12px;"><span style="font-family:-apple-system,sans-serif;font-weight:600;font-size:18px;color:#111827;">Ranki.ai</span></td>
        </tr>
      </table>
    </div>
    <div style="padding:40px 32px;">
      <div style="background:linear-gradient(135deg,#dc2626,#ea580c);border-radius:12px;padding:24px;text-align:center;margin:0 0 32px 0;">
        <p style="font-family:-apple-system,sans-serif;color:#ffffff;font-size:14px;margin:0 0 8px 0;">🔥 DERNIÈRE CHANCE</p>
        <p style="font-family:-apple-system,sans-serif;color:#ffffff;font-size:28px;font-weight:700;margin:0;">1 mois OFFERT</p>
        <p style="font-family:-apple-system,sans-serif;color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0 0;">Offre qui expire dans 24h</p>
      </div>
      <h1 style="font-family:-apple-system,sans-serif;color:#111827;font-size:24px;font-weight:600;margin:0 0 24px 0;">
        Dernière chance${firstName ? `, ${firstName}` : ""} ! ⏰
      </h1>
      <p style="font-family:-apple-system,sans-serif;color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        C'est notre <strong>meilleure offre</strong> : un mois entier gratuit pour essayer Ranki.ai sans risque.
        Après ça, on ne pourra plus vous la proposer.
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;">
        ${cartSummary}
      </div>
      <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:16px;text-align:center;margin:24px 0;">
        <p style="font-family:-apple-system,sans-serif;color:#991b1b;font-size:12px;margin:0 0 8px 0;text-transform:uppercase;">🎁 Code exclusif - 1 mois offert</p>
        <p style="font-family:'Courier New',monospace;color:#111827;font-size:24px;font-weight:700;margin:0;letter-spacing:2px;">${couponCode}</p>
        <p style="font-family:-apple-system,sans-serif;color:#991b1b;font-size:12px;margin:8px 0 0 0;">⚡ Expire dans 24h</p>
      </div>
      <div style="background:#ecfdf5;border-radius:8px;padding:16px;margin:24px 0;">
        <p style="font-family:-apple-system,sans-serif;color:#065f46;font-size:14px;margin:0;">
          ✅ Annuler à tout moment · ✅ Sans engagement · ✅ Données sécurisées
        </p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://ranki.ai/choose-plan" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ea580c);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:8px;font-family:-apple-system,sans-serif;font-size:18px;font-weight:700;">
          Réclamer mon mois gratuit →
        </a>
      </div>
      <p style="font-family:-apple-system,sans-serif;color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0 0;">
        Si vous ne souhaitez plus recevoir ces emails, ignorez simplement ce message.
      </p>
    </div>
    <div style="padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-family:-apple-system,sans-serif;color:#9ca3af;font-size:12px;margin:0;">© 2025 Ranki.ai · <a href="https://ranki.ai" style="color:#9ca3af;">ranki.ai</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Cart Summary HTML ─────────────────────────────────────────────
function buildCartSummary(items: any[], billingCycle: string): string {
  if (!items || items.length === 0) return "<p>Votre sélection Ranki.ai</p>";
  
  return items.map((item: any) => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">
      <span style="font-family:-apple-system,sans-serif;color:#374151;font-size:14px;">${item.name || "Article"}${item.quantity > 1 ? ` ×${item.quantity}` : ""}</span>
      <span style="font-family:-apple-system,sans-serif;color:#111827;font-size:14px;font-weight:600;">${item.price || 0}€/${billingCycle === "yearly" ? "an" : "mois"}</span>
    </div>
  `).join("");
}

// ─── Create Stripe Coupon ──────────────────────────────────────────
async function createStripeCoupon(type: "percent" | "free_month", percentOff?: number): Promise<{ code: string; id: string }> {
  try {
    const couponParams: any = {
      duration: "once" as const,
      max_redemptions: 1,
    };

    if (type === "percent" && percentOff) {
      couponParams.percent_off = percentOff;
      couponParams.name = `Panier abandonné -${percentOff}%`;
    } else {
      // 100% off for 1 month = free month
      couponParams.percent_off = 100;
      couponParams.duration = "repeating";
      couponParams.duration_in_months = 1;
      couponParams.name = "Panier abandonné - 1 mois offert";
    }

    const coupon = await stripe.coupons.create(couponParams);
    
    // Create a unique promo code
    const code = `STAR${type === "free_month" ? "FREE" : percentOff}${Date.now().toString(36).toUpperCase().slice(-4)}`;
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: 1,
    });

    return { code: promoCode.code, id: promoCode.id };
  } catch (err) {
    console.error("[AbandonedCart] Error creating Stripe coupon:", err);
    // Fallback code without Stripe
    const fallbackCode = `STAR${Date.now().toString(36).toUpperCase().slice(-6)}`;
    return { code: fallbackCode, id: "" };
  }
}

// ─── Send Email via send-email-notification ────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ to, subject, html, from_name: "Ranki.ai" }),
      }
    );
    const result = await response.json();
    return result.success === true;
  } catch (err) {
    console.error("[AbandonedCart] Email send error:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = new Date();
    console.log(`[AbandonedCart] Cron running at ${now.toISOString()}`);

    // Fetch all non-converted abandoned carts that still need emails
    const { data: carts, error } = await supabaseAdmin
      .from("abandoned_carts")
      .select("*")
      .eq("converted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[AbandonedCart] Fetch error:", error);
      throw error;
    }

    if (!carts || carts.length === 0) {
      console.log("[AbandonedCart] No abandoned carts to process");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[AbandonedCart] Found ${carts.length} abandoned carts to check`);

    let emailsSent = 0;

    for (const cart of carts) {
      const createdAt = new Date(cart.created_at);
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      const cartSummary = buildCartSummary(cart.cart_items as any[], cart.billing_cycle || "monthly");

      // ─── Email 1: After 1 hour ───
      if (!cart.email_1_sent_at && hoursSinceCreation >= 1) {
        console.log(`[AbandonedCart] Sending email 1 to ${cart.email} (${hoursSinceCreation.toFixed(1)}h since creation)`);
        
        const sent = await sendEmail(
          cart.email,
          "Vous avez oublié quelque chose ? 🛒",
          emailTemplate1(cart.full_name || "", cartSummary)
        );

        if (sent) {
          await supabaseAdmin
            .from("abandoned_carts")
            .update({ email_1_sent_at: now.toISOString() })
            .eq("id", cart.id);
          emailsSent++;
          console.log(`[AbandonedCart] ✅ Email 1 sent to ${cart.email}`);
        }
      }

      // ─── Email 2: After 24 hours with 10% discount ───
      if (!cart.email_2_sent_at && cart.email_1_sent_at && hoursSinceCreation >= 24) {
        console.log(`[AbandonedCart] Sending email 2 (10% discount) to ${cart.email}`);
        
        const { code } = await createStripeCoupon("percent", 10);
        
        const sent = await sendEmail(
          cart.email,
          "🎁 -10% pour vous ! Votre panier vous attend",
          emailTemplate2(cart.full_name || "", cartSummary, code, 10)
        );

        if (sent) {
          await supabaseAdmin
            .from("abandoned_carts")
            .update({ email_2_sent_at: now.toISOString(), coupon_code: code })
            .eq("id", cart.id);
          emailsSent++;
          console.log(`[AbandonedCart] ✅ Email 2 sent to ${cart.email} with coupon ${code}`);
        }
      }

      // ─── Email 3: After 72 hours with 1 free month ───
      if (!cart.email_3_sent_at && cart.email_2_sent_at && hoursSinceCreation >= 72) {
        console.log(`[AbandonedCart] Sending email 3 (1 free month) to ${cart.email}`);
        
        const { code } = await createStripeCoupon("free_month");
        
        const sent = await sendEmail(
          cart.email,
          "⏰ Dernière chance : 1 mois OFFERT !",
          emailTemplate3(cart.full_name || "", cartSummary, code)
        );

        if (sent) {
          await supabaseAdmin
            .from("abandoned_carts")
            .update({ email_3_sent_at: now.toISOString(), coupon_code: code })
            .eq("id", cart.id);
          emailsSent++;
          console.log(`[AbandonedCart] ✅ Email 3 sent to ${cart.email} with coupon ${code}`);
        }
      }
    }

    console.log(`[AbandonedCart] ✅ Done. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({ processed: carts.length, emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[AbandonedCart] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
