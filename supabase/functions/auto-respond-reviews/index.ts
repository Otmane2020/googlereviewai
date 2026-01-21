import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/googleAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate AI response using Lovable AI Gateway
async function generateAIResponse(
  review: any,
  aiSettings: any,
  businessName: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("[AutoRespond] LOVABLE_API_KEY not configured");
    return null;
  }

  const tone = aiSettings?.tone || "friendly";
  const responseLength = aiSettings?.response_length || "M";
  const includeSignature = aiSettings?.include_signature ?? true;
  const signature = aiSettings?.signature?.replace("{business_name}", businessName) || "";
  const customTemplate = aiSettings?.custom_template || "";

  const lengthMap: Record<string, string> = {
    S: "Keep the response brief, around 2-3 sentences.",
    M: "Write a medium-length response, around 4-5 sentences.",
    L: "Write a detailed response, around 6-8 sentences.",
  };
  const lengthInstruction = lengthMap[responseLength] || lengthMap.M;

  const toneMap: Record<string, string> = {
    friendly: "Use a warm, friendly, and approachable tone.",
    professional: "Use a professional and formal tone.",
    casual: "Use a casual and relaxed tone.",
    empathetic: "Use an empathetic and understanding tone.",
    humorous: "Use a light, humorous, and fun tone while remaining respectful.",
    warm: "Use a warm, caring, and compassionate tone.",
  };
  const toneInstruction = toneMap[tone] || toneMap.friendly;

  const systemPrompt = `You are an AI assistant that generates professional responses to customer reviews in French.
${toneInstruction}
${lengthInstruction}
Always thank the customer and address their specific feedback.
${review.rating >= 4 ? "This is a positive review, express gratitude." : "This is a critical review, show empathy and offer to improve."}
${customTemplate ? `Additional instructions: ${customTemplate}` : ""}
${includeSignature && signature ? `End with this signature: ${signature}` : ""}
Do not include any greeting like "Cher client" - start directly with the response.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a response for this ${review.rating}-star review from ${review.author}: "${review.comment || "No comment provided"}"` },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[AutoRespond] AI gateway error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// Publish reply to Google
async function publishToGoogle(
  accessToken: string,
  review: any,
  aiResponse: string
): Promise<boolean> {
  const locationName = `locations/${review.location_id}`;
  const reviewName = review.review_id.startsWith("accounts/")
    ? review.review_id
    : `${locationName}/reviews/${review.review_id}`;

  console.log(`[AutoRespond] Publishing to Google: ${reviewName}`);

  const googleResponse = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: aiResponse }),
    }
  );

  if (!googleResponse.ok) {
    const errorText = await googleResponse.text();
    console.error("[AutoRespond] Google API error:", googleResponse.status, errorText);
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // CRON uses SERVICE_ROLE only - no user session
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[AutoRespond] Starting auto-respond-reviews job...");

    // Get users with AI enabled
    const { data: settings } = await supabase
      .from("ai_settings")
      .select("user_id, auto_sync_reviews, auto_publish_to_google, minimum_rating, auto_reply_delay, tone, response_length, include_signature, signature, custom_template")
      .eq("enabled", true);

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users with AI enabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalResponses = 0;
    let totalPublished = 0;

    for (const userSettings of settings) {
      try {
        // Get profile with credits and email
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, google_refresh_token, email, full_name")
          .eq("id", userSettings.user_id)
          .single();

        if (!profile || profile.credits < 1) {
          console.log(`[AutoRespond] User ${userSettings.user_id} has insufficient credits`);
          
          // Send upgrade email if credits are 0 and user has pending reviews
          if (profile && profile.credits === 0 && profile.email) {
            // Check if we have pending reviews for this user
            const { count: pendingCount } = await supabase
              .from("reviews")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userSettings.user_id)
              .is("ai_response", null);
            
            if (pendingCount && pendingCount > 0) {
              // Check if we already sent an email recently (last 24h)
              const { data: recentNotif } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", userSettings.user_id)
                .eq("type", "low_credits")
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .limit(1);
              
              if (!recentNotif || recentNotif.length === 0) {
                console.log(`[AutoRespond] Sending upgrade email to ${profile.email}`);
                
                // Send upgrade email via send-engagement-email function
                try {
                  const emailResponse = await fetch(
                    `${supabaseUrl}/functions/v1/send-engagement-email`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${supabaseServiceKey}`,
                      },
                      body: JSON.stringify({
                        email: profile.email,
                        name: profile.full_name || "Client",
                        type: "no_credits_upgrade",
                        data: { pending_count: pendingCount, credits: 0 }
                      }),
                    }
                  );
                  
                  if (emailResponse.ok) {
                    console.log(`[AutoRespond] Upgrade email sent to ${profile.email}`);
                  } else {
                    console.error(`[AutoRespond] Failed to send upgrade email:`, await emailResponse.text());
                  }
                } catch (emailError) {
                  console.error(`[AutoRespond] Email sending error:`, emailError);
                }
                
                // Create in-app notification for upgrade
                await supabase.from("notifications").insert({
                  user_id: userSettings.user_id,
                  type: "low_credits",
                  title: "⚠️ Crédits épuisés",
                  message: `${pendingCount} avis attendent une réponse. Rechargez vos crédits pour continuer.`,
                });
              }
            }
          }
          
          continue;
        }

        // Get reviews without AI response
        const { data: reviews } = await supabase
          .from("reviews")
          .select("*")
          .eq("user_id", userSettings.user_id)
          .is("ai_response", null)
          .gte("rating", userSettings.minimum_rating || 1)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!reviews || reviews.length === 0) continue;

        // Get business name
        const { data: business } = await supabase
          .from("businesses")
          .select("name")
          .eq("user_id", userSettings.user_id)
          .limit(1)
          .single();

        const businessName = business?.name || "Notre équipe";

        for (const review of reviews) {
          if (profile.credits < 1) break;

          // Check if review is old enough based on auto_reply_delay
          const reviewDate = new Date(review.created_at);
          const delayMinutes = userSettings.auto_reply_delay || 5;
          const now = new Date();
          const timeDiff = (now.getTime() - reviewDate.getTime()) / (1000 * 60);

          if (timeDiff < delayMinutes) {
            console.log(`[AutoRespond] Review ${review.id} is too recent, waiting ${delayMinutes - timeDiff} more minutes`);
            continue;
          }

          // Generate AI response using Lovable AI Gateway
          const aiResponse = await generateAIResponse(
            review,
            userSettings,
            businessName
          );

          if (!aiResponse) continue;

          // Update review with AI response
          await supabase
            .from("reviews")
            .update({ ai_response: aiResponse })
            .eq("id", review.id);

          // Deduct credit
          const newCredits = profile.credits - 1;
          await supabase
            .from("profiles")
            .update({ credits: newCredits })
            .eq("id", userSettings.user_id);
          profile.credits = newCredits;

          // Log credit usage
          await supabase.from("credits_history").insert({
            user_id: userSettings.user_id,
            amount: -1,
            type: "usage",
            description: `Auto-réponse IA pour l'avis de ${review.author}`,
          });

          totalResponses++;

          // Create notification for AI response
          await supabase.from("notifications").insert({
            user_id: userSettings.user_id,
            type: "ai_response",
            title: "Réponse IA générée automatiquement",
            message: `Une réponse a été générée pour l'avis de ${review.author}`,
            review_id: review.id,
          });

          // Auto-publish if enabled and user has Google token
          if (userSettings.auto_publish_to_google && profile.google_refresh_token) {
            // Get access token using shared helper (SERVICE_ROLE client)
            const tokenResult = await getGoogleAccessToken(supabase, userSettings.user_id);

            if (tokenResult.token) {
              const published = await publishToGoogle(tokenResult.token, review, aiResponse);
              
              if (published) {
                await supabase
                  .from("reviews")
                  .update({
                    replied: true,
                    published_to_google: true,
                    published_at: new Date().toISOString(),
                  })
                  .eq("id", review.id);

                totalPublished++;

                // Notification for publication
                await supabase.from("notifications").insert({
                  user_id: userSettings.user_id,
                  type: "reply_published",
                  title: "Réponse publiée sur Google",
                  message: `Votre réponse à l'avis de ${review.author} a été publiée automatiquement.`,
                  review_id: review.id,
                });
              }
            } else {
              console.log(`[AutoRespond] Could not get token for user ${userSettings.user_id}: ${tokenResult.error}`);
            }
          }
        }
      } catch (userError) {
        console.error(`[AutoRespond] Error processing user ${userSettings.user_id}:`, userError);
      }
    }

    const message = `[AutoRespond] Completed: ${totalResponses} responses generated, ${totalPublished} published to Google`;
    console.log(message);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        responses_generated: totalResponses,
        published_to_google: totalPublished,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[AutoRespond] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
