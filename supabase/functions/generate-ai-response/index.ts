import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId, userId } = await req.json();
    console.log("Generating AI response for review:", reviewId, "user:", userId);

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, plan_name")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw new Error("User profile not found");
    }

    if (!profile || profile.credits < 1) {
      return new Response(
        JSON.stringify({ 
          error: "Crédits insuffisants. Rechargez votre compte pour continuer.", 
          credits: profile?.credits || 0 
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("user_id", userId)
      .single();

    if (reviewError || !review) {
      console.error("Review fetch error:", reviewError);
      throw new Error("Review not found");
    }

    // Fetch AI settings
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Fetch business info for signature
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("user_id", userId)
      .limit(1)
      .single();

    const tone = aiSettings?.tone || "friendly";
    const responseLength = aiSettings?.response_length || "M";
    const includeSignature = aiSettings?.include_signature ?? true;
    const signature = aiSettings?.signature?.replace("{business_name}", business?.name || "Notre équipe") || "";
    const customTemplate = aiSettings?.custom_template || "";

    const lengthMap: Record<string, string> = {
      S: "Keep the response brief, around 2-3 sentences.",
      M: "Write a medium-length response, around 4-5 sentences.",
      L: "Write a detailed response, around 6-8 sentences.",
    };
    const lengthInstruction = lengthMap[responseLength] || "Write a medium-length response.";

    const toneMap: Record<string, string> = {
      friendly: "Use a warm, friendly, and approachable tone.",
      professional: "Use a professional and formal tone.",
      casual: "Use a casual and relaxed tone.",
      empathetic: "Use an empathetic and understanding tone.",
      humorous: "Use a light, humorous, and fun tone while remaining respectful.",
      warm: "Use a warm, caring, and compassionate tone that shows genuine empathy.",
    };
    const toneInstruction = toneMap[tone] || "Use a friendly tone.";

    const systemPrompt = `You are an AI assistant that generates professional responses to customer reviews in French.
${toneInstruction}
${lengthInstruction}
Always thank the customer and address their specific feedback.
${review.rating >= 4 ? "This is a positive review, express gratitude." : "This is a critical review, show empathy and offer to improve."}
${customTemplate ? `Additional instructions: ${customTemplate}` : ""}
${includeSignature && signature ? `End with this signature: ${signature}` : ""}
Do not include any greeting like "Cher client" - start directly with the response.`;

    console.log("Calling OpenRouter API...");
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://starlinko.lovable.app",
        "X-Title": "Starlinko",
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    console.log("AI response generated:", aiResponse?.substring(0, 100));

    if (!aiResponse) {
      throw new Error("No response generated");
    }

    // Deduct 1 credit
    const newCredits = profile.credits - 1;
    const { error: creditError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (creditError) {
      console.error("Credit deduction error:", creditError);
    }

    // Log credit usage
    await supabase.from("credits_history").insert({
      user_id: userId,
      amount: -1,
      type: "usage",
      description: `Réponse IA pour l'avis de ${review.author}`,
    });

    // Update review with AI response
    const { error: updateError } = await supabase
      .from("reviews")
      .update({ ai_response: aiResponse })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save response");
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "ai_response",
      title: "Réponse IA générée",
      message: `Une réponse a été générée pour l'avis de ${review.author}`,
      review_id: reviewId,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiResponse,
      credits_remaining: newCredits 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
