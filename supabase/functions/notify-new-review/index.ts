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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Bonjour ${userName},</h2>
                <p>Vous avez reçu un nouvel avis de <strong>${author}</strong> :</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 24px; margin: 0 0 10px 0;">${stars}</p>
                  ${comment ? `<p style="font-style: italic; color: #555;">"${comment}"</p>` : ''}
                </div>
                <p>Connectez-vous à Starlinko pour répondre à cet avis.</p>
                <a href="${fullReviewUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">Voir l'avis</a>
                <p style="color: #888; font-size: 12px; margin-top: 30px;">Starlinko - Gérez vos avis Google facilement</p>
              </div>
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
