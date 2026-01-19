import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Refresh Google access token
async function refreshGoogleToken(
  supabase: any,
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_refresh_token, google_access_token, google_token_expires_at")
    .eq("id", userId)
    .single();

  if (!profile?.google_refresh_token) {
    console.log(`No refresh token for user ${userId}`);
    return null;
  }

  // Check if token is still valid
  if (profile.google_token_expires_at && profile.google_access_token) {
    const expiresAt = new Date(profile.google_token_expires_at);
    if (expiresAt.getTime() - 5 * 60 * 1000 > Date.now()) {
      return profile.google_access_token;
    }
  }

  console.log(`Refreshing token for user ${userId}`);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error(`Token refresh failed:`, tokenData);
    if (tokenData.error === "invalid_grant") {
      await supabase.from("profiles").update({
        google_refresh_token: null,
        google_access_token: null,
        google_token_expires_at: null,
      }).eq("id", userId);
    }
    return null;
  }

  const { access_token, expires_in } = tokenData;
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  await supabase.from("profiles").update({
    google_access_token: access_token,
    google_token_expires_at: expiresAt,
  }).eq("id", userId);

  return access_token;
}

// Generate AI response
async function generateAIResponse(
  review: any,
  aiSettings: any,
  businessName: string,
  OPENROUTER_API_KEY: string
): Promise<string | null> {
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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://starlinko.lovable.app",
      "X-Title": "Starlinko",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a response for this ${review.rating}-star review from ${review.author}: "${review.comment || "No comment provided"}"` },
      ],
    }),
  });

  if (!response.ok) {
    console.error("AI gateway error:", response.status);
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

  console.log(`Publishing to Google: ${reviewName}`);

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
    console.error("Google API error:", googleResponse.status, errorText);
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
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting auto-respond-reviews job...");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ success: false, message: "Google OAuth not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, message: "OPENROUTER_API_KEY not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get users with auto-sync and auto-publish enabled
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
        // Get profile with credits
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, google_refresh_token")
          .eq("id", userSettings.user_id)
          .single();

        if (!profile || profile.credits < 1) {
          console.log(`User ${userSettings.user_id} has insufficient credits`);
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
            console.log(`Review ${review.id} is too recent, waiting ${delayMinutes - timeDiff} more minutes`);
            continue;
          }

          // Generate AI response
          const aiResponse = await generateAIResponse(
            review,
            userSettings,
            businessName,
            OPENROUTER_API_KEY
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
            const accessToken = await refreshGoogleToken(
              supabase,
              userSettings.user_id,
              clientId,
              clientSecret
            );

            if (accessToken) {
              const published = await publishToGoogle(accessToken, review, aiResponse);
              
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
            }
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${userSettings.user_id}:`, userError);
      }
    }

    const message = `Auto-respond completed: ${totalResponses} responses generated, ${totalPublished} published to Google`;
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
    console.error("Auto-respond error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
