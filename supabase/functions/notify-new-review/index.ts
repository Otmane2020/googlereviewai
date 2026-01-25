import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewPayload {
  review_id: string;
  user_id: string;
  author: string;
  rating: number;
  comment: string | null;
}

// Professional email design system
const STYLES = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgWhite: "#ffffff",
  bgLight: "#f9fafb",
  borderLight: "#e5e7eb",
  brandBlue: "#2563eb",
};

const getProHeader = () => `
  <div style="background: ${STYLES.bgWhite}; padding: 32px 24px; border-bottom: 1px solid ${STYLES.borderLight};">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align: middle;">
          <img src="https://starlinko.lovable.app/favicon.png" width="32" height="32" alt="Starlinko" style="display: block;" />
        </td>
        <td style="vertical-align: middle; padding-left: 12px;">
          <span style="font-family: ${STYLES.fontFamily}; font-weight: 600; font-size: 18px; color: ${STYLES.textPrimary};">Starlinko</span>
        </td>
      </tr>
    </table>
  </div>
`;

const getProFooter = () => `
  <div style="padding: 24px; text-align: center; border-top: 1px solid ${STYLES.borderLight};">
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0 0 8px 0;">
      © 2025 Starlinko. Tous droits réservés.
    </p>
    <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 12px; margin: 0;">
      <a href="https://starlinko.lovable.app" style="color: ${STYLES.brandBlue}; text-decoration: none;">starlinko.lovable.app</a>
    </p>
  </div>
`;

const getProButton = (text: string, url: string) => `
  <a href="${url}" 
     style="display: inline-block; background-color: ${STYLES.brandBlue}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-family: ${STYLES.fontFamily}; font-size: 14px; font-weight: 500;">
    ${text}
  </a>
`;

const getStarsDisplay = (rating: number) => {
  const filled = "★";
  const empty = "☆";
  return filled.repeat(rating) + empty.repeat(5 - rating);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ReviewPayload = await req.json();
    const { review_id, user_id, author, rating, comment } = payload;

    console.log("[notify-new-review] Received payload:", { review_id, user_id, author, rating });

    if (!user_id || !review_id) {
      console.error("[notify-new-review] Missing user_id or review_id");
      return new Response(
        JSON.stringify({ error: "Missing user_id or review_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reviewUrl = `/reviews?review_id=${review_id}`;
    const fullReviewUrl = `https://starlinko.lovable.app/reviews?review_id=${review_id}`;

    const [settingsResult, profileResult] = await Promise.all([
      supabase.from("ai_settings").select("email_notifications").eq("user_id", user_id).single(),
      supabase.from("profiles").select("email, full_name").eq("id", user_id).single(),
    ]);

    const emailNotificationsEnabled = settingsResult.data?.email_notifications ?? true;
    const userEmail = profileResult.data?.email;
    const userName = profileResult.data?.full_name?.split(" ")[0] || "";

    console.log("[notify-new-review] Settings:", { emailNotificationsEnabled, userEmail });

    // 1. Create in-app notification
    const notificationTitle = `Nouvel avis ${rating} étoile${rating > 1 ? 's' : ''}`;
    const notificationMessage = comment 
      ? `${author} : "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`
      : `${author} a laissé un avis.`;

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id,
      type: "new_review",
      title: notificationTitle,
      message: notificationMessage,
      review_id,
      read: false,
    });

    if (notifError) {
      console.error("[notify-new-review] Error creating notification:", notifError);
    } else {
      console.log("[notify-new-review] In-app notification created");
    }

    // 2. Send email notification if enabled
    if (emailNotificationsEnabled && userEmail) {
      try {
        const starsDisplay = getStarsDisplay(rating);
        
        const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${STYLES.bgLight};">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${STYLES.bgWhite};">
    ${getProHeader()}
    <div style="padding: 40px 32px;">
      <h1 style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Nouvel avis reçu
      </h1>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Bonjour${userName ? ` ${userName}` : ''},
      </p>
      
      <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Vous avez reçu un nouvel avis de <strong>${author}</strong>.
      </p>
      
      <div style="background: ${STYLES.bgLight}; border-radius: 6px; padding: 20px; margin: 24px 0;">
        <p style="font-family: ${STYLES.fontFamily}; color: #f59e0b; font-size: 20px; margin: 0 0 12px 0; letter-spacing: 2px;">
          ${starsDisplay}
        </p>
        ${comment ? `
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textPrimary}; font-size: 15px; font-style: italic; line-height: 1.6; margin: 0;">
          "${comment}"
        </p>
        ` : `
        <p style="font-family: ${STYLES.fontFamily}; color: ${STYLES.textMuted}; font-size: 14px; margin: 0;">
          Aucun commentaire
        </p>
        `}
      </div>
      
      <div style="text-align: left; margin: 32px 0;">
        ${getProButton("Voir et répondre", fullReviewUrl)}
      </div>
    </div>
    ${getProFooter()}
  </div>
</body>
</html>
        `;

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: userEmail,
            subject: `Nouvel avis ${rating} étoile${rating > 1 ? 's' : ''} reçu`,
            html: emailHtml,
            from_name: "Starlinko",
          }),
        });

        if (emailResponse.ok) {
          console.log("[notify-new-review] Email sent successfully");
        } else {
          const errorText = await emailResponse.text();
          console.error("[notify-new-review] Email send failed:", errorText);
        }
      } catch (emailError) {
        console.error("[notify-new-review] Email error:", emailError);
      }
    }

    // 3. Send push notification
    try {
      const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id,
          title: notificationTitle,
          body: notificationMessage,
          url: reviewUrl,
          // FCM requires all `data.*` values to be strings
          data: { review_id: String(review_id) },
        }),
      });

      if (pushResponse.ok) {
        const pushResult = await pushResponse.json();
        console.log("[notify-new-review] Push notification result:", pushResult);
      } else {
        const pushError = await pushResponse.text();
        console.error("[notify-new-review] Push notification failed:", pushError);
      }
    } catch (pushError) {
      console.error("[notify-new-review] Push error:", pushError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[notify-new-review] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
