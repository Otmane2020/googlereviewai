import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate AI response using OpenRouter
async function generateAIResponse(
  review: any,
  aiSettings: any,
  businessName: string
): Promise<string | null> {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_API_KEY) {
    console.error("[OldReviewsBatch] OPENROUTER_API_KEY not configured");
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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://starlinko.com",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a response for this ${review.rating}-star review from ${review.author}: "${review.comment || "No comment provided"}"` },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[OldReviewsBatch] OpenRouter error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();

    if (!userId) {
      throw new Error("Missing userId");
    }

    console.log(`[OldReviewsBatch] Starting batch processing for user ${userId}`);

    // Get user's AI settings and enabled date
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!aiSettings) {
      throw new Error("AI settings not found");
    }

    const enabledAt = new Date(aiSettings.created_at);

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Get old reviews (before AI was enabled, without AI response AND without Google reply)
    // This ensures we don't generate responses for already-replied reviews
    const { data: oldReviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .is("ai_response", null)
      .is("google_reply", null) // Skip reviews that already have a Google reply
      .eq("replied", false) // Skip reviews marked as replied
      .lt("created_at", enabledAt.toISOString())
      .order("created_at", { ascending: false });

    console.log(`[OldReviewsBatch] Found ${oldReviews?.length || 0} old reviews without any response`);

    if (!oldReviews || oldReviews.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No old reviews to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has enough credits
    if (profile.credits < oldReviews.length) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits", 
          required: oldReviews.length, 
          available: profile.credits 
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business name
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("user_id", userId)
      .limit(1)
      .single();

    const businessName = business?.name || "Notre équipe";

    let processed = 0;
    let creditsUsed = 0;

    // Process reviews in batches of 5 to avoid timeouts
    for (const review of oldReviews) {
      if (profile.credits - creditsUsed < 1) break;

      const aiResponse = await generateAIResponse(review, aiSettings, businessName);

      if (!aiResponse) continue;

      // Update review with AI response
      await supabase
        .from("reviews")
        .update({ ai_response: aiResponse })
        .eq("id", review.id);

      creditsUsed++;
      processed++;

      // Log credit usage
      await supabase.from("credits_history").insert({
        user_id: userId,
        amount: -1,
        type: "usage",
        description: `Réponse IA (ancien avis) pour ${review.author}`,
      });
    }

    // Deduct all used credits at once
    if (creditsUsed > 0) {
      await supabase
        .from("profiles")
        .update({ credits: profile.credits - creditsUsed })
        .eq("id", userId);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "batch_complete",
        title: "Anciens avis traités",
        message: `${processed} réponses IA générées pour vos anciens avis.`,
      });
    }

    console.log(`[OldReviewsBatch] Completed: ${processed} reviews processed, ${creditsUsed} credits used`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        creditsUsed,
        remaining: profile.credits - creditsUsed 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[OldReviewsBatch] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
