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

serve(async (req) => {
  // Handle CORS preflight
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

    // URL with review_id filter to navigate directly to this review
    const reviewUrl = `/reviews?review_id=${review_id}`;
    const fullReviewUrl = `https://starlinko.lovable.app/reviews?review_id=${review_id}`;

    // Get user settings and profile
    const [settingsResult, profileResult] = await Promise.all([
      supabase.from("ai_settings").select("email_notifications").eq("user_id", user_id).single(),
      supabase.from("profiles").select("email, full_name").eq("id", user_id).single(),
    ]);

    const emailNotificationsEnabled = settingsResult.data?.email_notifications ?? true;
    const userEmail = profileResult.data?.email;
    const userName = profileResult.data?.full_name || "Utilisateur";

    console.log("[notify-new-review] Settings:", { emailNotificationsEnabled, userEmail });

    // 1. Create in-app notification
    const stars = "⭐".repeat(rating);
    const notificationTitle = `Nouvel avis ${stars}`;
    const notificationMessage = comment 
      ? `${author} : "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`
      : `${author} a laissé un avis ${rating} étoiles.`;

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
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: userEmail,
            subject: `Nouvel avis ${stars} reçu sur votre fiche`,
            html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #2563eb; padding: 30px; text-align: center;">
      <span style="font-size: 32px; color: #facc15;">★</span>
      <h1 style="color: #ffffff; margin: 8px 0 0 0; font-size: 24px; font-weight: 700;">Starlinko</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${userName} 👋</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Vous avez reçu un nouvel avis de <strong>${author}</strong> :
      </p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #facc15;">
        <p style="font-size: 28px; margin: 0 0 10px 0;">${stars}</p>
        ${comment ? `<p style="font-style: italic; color: #374151; margin: 0; font-size: 15px; line-height: 1.5;">"${comment}"</p>` : '<p style="color: #6b7280; margin: 0; font-size: 14px;">Aucun commentaire</p>'}
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${fullReviewUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          💬 Voir et répondre
        </a>
      </div>
    </div>
    <div style="background-color: #1e293b; padding: 25px; text-align: center;">
      <span style="font-size: 20px; color: #facc15;">★</span>
      <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">
        Starlinko - <a href="https://starlinko.lovable.app" style="color: #60a5fa; text-decoration: none;">starlinko.lovable.app</a>
      </p>
    </div>
  </div>
</body>
</html>
            `,
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

    // 3. Send push notification with review_id in URL
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
          url: reviewUrl, // URL with review_id filter
          data: { review_id },
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
