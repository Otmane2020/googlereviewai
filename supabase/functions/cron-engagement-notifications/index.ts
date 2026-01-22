import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to send engagement email
async function sendEngagementEmail(
  supabaseUrl: string,
  supabaseKey: string,
  email: string,
  name: string | null,
  type: string,
  data?: Record<string, unknown>
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-engagement-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ email, name, type, data }),
    });
    const result = await response.json();
    console.log(`Email ${type} to ${email}:`, result.success ? "sent" : result.error);
    return result.success;
  } catch (error) {
    console.error(`Failed to send ${type} email to ${email}:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active users with their profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, credits");

    if (profilesError) {
      throw profilesError;
    }

    const notifications: { user_id: string; title: string; message: string; type: string }[] = [];
    const emailsSent: string[] = [];
    const now = new Date();
    const hour = now.getHours();
    const today = now.toISOString().split("T")[0];

    // Morning notifications (around 9 AM)
    const isMorning = hour >= 8 && hour <= 10;
    // Evening notifications (around 6 PM)
    const isEvening = hour >= 17 && hour <= 19;

    for (const profile of profiles || []) {
      // Check AI settings for auto-reply status
      const { data: aiSettings } = await supabase
        .from("ai_settings")
        .select("enabled, auto_publish_to_google")
        .eq("user_id", profile.id)
        .maybeSingle();

      // Check pending reviews (no AI response AND no Google reply AND not marked as replied)
      // This ensures we only count truly pending reviews, not old ones already handled
      const { data: pendingReviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", profile.id)
        .is("ai_response", null)
        .is("google_reply", null)
        .eq("replied", false);

      const pendingCount = pendingReviews?.length || 0;

      // === EMAIL: Activate auto-reply (if not enabled and has reviews) ===
      if (!aiSettings?.enabled && pendingCount > 0) {
        // Check if we already sent this email recently (7 days)
        const { data: recentEmail } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", profile.id)
          .eq("type", "email_activate_auto_reply")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!recentEmail?.length) {
          const sent = await sendEngagementEmail(
            supabaseUrl,
            supabaseServiceKey,
            profile.email,
            profile.full_name,
            "activate_auto_reply"
          );
          if (sent) {
            emailsSent.push(`activate_auto_reply:${profile.email}`);
            // Log that we sent this email
            await supabase.from("notifications").insert({
              user_id: profile.id,
              title: "Email envoyé",
              message: "Email d'activation auto-reply envoyé",
              type: "email_activate_auto_reply",
            });
          }
        }
      }

      // === EMAIL: Pending reviews (if > 3 and morning) ===
      if (isMorning && pendingCount >= 3) {
        const { data: recentEmail } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", profile.id)
          .eq("type", "email_pending_reviews")
          .gte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!recentEmail?.length) {
          const sent = await sendEngagementEmail(
            supabaseUrl,
            supabaseServiceKey,
            profile.email,
            profile.full_name,
            "pending_reviews",
            { pending_count: pendingCount }
          );
          if (sent) {
            emailsSent.push(`pending_reviews:${profile.email}`);
            await supabase.from("notifications").insert({
              user_id: profile.id,
              title: "Email envoyé",
              message: `Email avis en attente (${pendingCount}) envoyé`,
              type: "email_pending_reviews",
            });
          }
        }
      }

      // === EMAIL: Low credits (if <= 3 and not on subscription) ===
      if (profile.credits <= 3 && profile.credits > 0) {
        const { data: activeSub } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", profile.id)
          .eq("subscription_status", "active")
          .maybeSingle();

        if (!activeSub) {
          const { data: recentEmail } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", profile.id)
            .eq("type", "email_low_credits")
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!recentEmail?.length) {
            const sent = await sendEngagementEmail(
              supabaseUrl,
              supabaseServiceKey,
              profile.email,
              profile.full_name,
              "low_credits",
              { credits: profile.credits }
            );
            if (sent) {
              emailsSent.push(`low_credits:${profile.email}`);
              await supabase.from("notifications").insert({
                user_id: profile.id,
                title: "Email envoyé",
                message: `Email crédits faibles (${profile.credits}) envoyé`,
                type: "email_low_credits",
              });
            }
          }
        }
      }

      // === IN-APP NOTIFICATIONS ===
      if (pendingCount > 0) {
        notifications.push({
          user_id: profile.id,
          title: "📝 Avis en attente",
          message: `Vous avez ${pendingCount} avis sans réponse. Générez des réponses IA maintenant !`,
          type: "pending_reviews",
        });
      }

      // Get user's businesses for SEO/AEO suggestions
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .limit(1);

      if (businesses && businesses.length > 0) {
        // Check if user has SEO subscription
        const { data: seoSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", profile.id)
          .eq("module", "seo")
          .eq("status", "active")
          .maybeSingle();

        // Check if user has AEO subscription
        const { data: aeoSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", profile.id)
          .eq("module", "aeo")
          .eq("status", "active")
          .maybeSingle();

        // SEO suggestion (morning)
        if (isMorning) {
          if (seoSub) {
            const { data: lastArticle } = await supabase
              .from("seo_articles")
              .select("created_at")
              .eq("user_id", profile.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const lastArticleDate = lastArticle?.created_at ? new Date(lastArticle.created_at) : null;
            const daysSinceLastArticle = lastArticleDate 
              ? Math.floor((now.getTime() - lastArticleDate.getTime()) / (1000 * 60 * 60 * 24))
              : 999;

            if (daysSinceLastArticle >= 1) {
              notifications.push({
                user_id: profile.id,
                title: "✍️ Boostez votre SEO",
                message: "Créez un nouvel article SEO pour améliorer votre visibilité locale !",
                type: "seo_reminder",
              });
            }
          } else {
            notifications.push({
              user_id: profile.id,
              title: "🚀 Découvrez SEO AutoPost",
              message: "Publiez automatiquement des articles optimisés pour Google. Essayez maintenant !",
              type: "seo_promo",
            });
          }
        }

        // AEO suggestion (evening)
        if (isEvening) {
          if (aeoSub) {
            const { data: lastQA } = await supabase
              .from("aeo_questions")
              .select("created_at")
              .eq("user_id", profile.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const lastQADate = lastQA?.created_at ? new Date(lastQA.created_at) : null;
            const daysSinceLastQA = lastQADate 
              ? Math.floor((now.getTime() - lastQADate.getTime()) / (1000 * 60 * 60 * 24))
              : 999;

            if (daysSinceLastQA >= 1) {
              notifications.push({
                user_id: profile.id,
                title: "🤖 Optimisez pour ChatGPT",
                message: "Ajoutez une nouvelle Q&A pour apparaître dans les réponses IA !",
                type: "aeo_reminder",
              });
            }
          } else {
            notifications.push({
              user_id: profile.id,
              title: "💡 Nouveau: ChatGPT Rank",
              message: "Apparaissez dans les réponses de ChatGPT et autres IA. Découvrez AEO !",
              type: "aeo_promo",
            });
          }
        }

        // AI optimization tips
        if (!aiSettings?.enabled) {
          notifications.push({
            user_id: profile.id,
            title: "⚡ Activez l'IA",
            message: "Activez les réponses automatiques pour gagner du temps sur vos avis !",
            type: "ai_tip",
          });
        } else if (!aiSettings?.auto_publish_to_google && pendingCount > 5) {
          notifications.push({
            user_id: profile.id,
            title: "🎯 Publication auto",
            message: "Activez la publication automatique pour répondre plus vite à vos clients !",
            type: "ai_tip",
          });
        }
      }
    }

    // Insert all in-app notifications (avoid duplicates from same day)
    for (const notif of notifications) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", notif.user_id)
        .eq("type", notif.type)
        .gte("created_at", `${today}T00:00:00`)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notifications").insert(notif);
      }
    }

    console.log(`Generated ${notifications.length} in-app notifications, sent ${emailsSent.length} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: notifications.length,
        emails_sent: emailsSent.length,
        time: isMorning ? "morning" : isEvening ? "evening" : "other"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating engagement notifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
