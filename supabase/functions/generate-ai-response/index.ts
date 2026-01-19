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
    const { reviewId, userId, businessId } = await req.json();
    console.log("Generating AI response for review:", reviewId, "user:", userId, "business:", businessId);

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

    // Fetch review with location_id to find correct business
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

    // Fetch the CORRECT business based on businessId or review's location_id
    let business = null;
    
    if (businessId) {
      // Use the explicitly provided businessId
      const { data: businessData } = await supabase
        .from("businesses")
        .select("id, name, description, google_place_id")
        .eq("id", businessId)
        .eq("user_id", userId)
        .single();
      business = businessData;
    }
    
    // Fallback: find business by review's location_id
    if (!business && review.location_id) {
      const { data: businessData } = await supabase
        .from("businesses")
        .select("id, name, description, google_place_id")
        .eq("google_place_id", review.location_id)
        .eq("user_id", userId)
        .single();
      business = businessData;
    }

    const businessName = business?.name || "Notre établissement";
    const businessDescription = business?.description || "";
    console.log("Using business:", businessName);

    // Fetch AI settings
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    const tone = aiSettings?.tone || "friendly";
    const responseLength = aiSettings?.response_length || "M";
    const includeSignature = aiSettings?.include_signature ?? true;
    const customTemplate = aiSettings?.custom_template || "";
    
    // Build signature with correct business name
    let signature = "";
    if (includeSignature && aiSettings?.signature) {
      signature = aiSettings.signature
        .replace("{business_name}", businessName)
        .replace("{nom_etablissement}", businessName);
    } else if (includeSignature) {
      signature = `— L'équipe ${businessName}`;
    }

    // Length instructions in French
    const lengthMap: Record<string, string> = {
      S: "1 à 2 phrases courtes (20-40 mots)",
      M: "2 à 4 phrases (40-80 mots)",
      L: "4 à 6 phrases (80-150 mots)",
    };
    const lengthInstruction = lengthMap[responseLength] || "2 à 4 phrases (40-80 mots)";

    // Tone instructions in French
    const toneMap: Record<string, string> = {
      friendly: "amical et chaleureux",
      professional: "professionnel et formel",
      casual: "décontracté et naturel",
      empathetic: "empathique et compréhensif",
      humorous: "léger avec une touche d'humour tout en restant respectueux",
      warm: "chaleureux et bienveillant",
    };
    const toneInstruction = toneMap[tone] || "amical et professionnel";

    // Determine response strategy based on rating
    let ratingStrategy = "";
    if (review.rating >= 4) {
      ratingStrategy = "C'est un avis positif. Exprime ta gratitude chaleureusement et encourage le client à revenir.";
    } else if (review.rating === 3) {
      ratingStrategy = "C'est un avis mitigé. Remercie le client, reconnais les points à améliorer et montre ta volonté de faire mieux.";
    } else {
      ratingStrategy = "C'est un avis négatif. Montre de l'empathie, présente des excuses sincères et propose une solution ou un geste commercial.";
    }

    // Build the prompt inspired by the user's example
    const prompt = `Tu es un assistant professionnel qui répond aux avis Google My Business pour ${businessName}.
${businessDescription ? `\nContexte de l'établissement : ${businessDescription}` : ""}

Avis reçu :
- Auteur : ${review.author}
- Note : ${review.rating}/5
- Commentaire : "${review.comment || "Aucun commentaire"}"

Ta mission :
1. Remercier le client pour son retour.
2. ${ratingStrategy}
3. Répondre en ${lengthInstruction}.
4. Utiliser un ton : ${toneInstruction}.
${customTemplate ? `5. Instructions supplémentaires : ${customTemplate}` : ""}
${signature ? `6. Terminer par cette signature : "${signature}"` : ""}

IMPORTANT :
- NE PAS commencer par "Cher client" ou "Bonjour" - commence directement par le contenu.
- Personnalise la réponse en mentionnant des détails spécifiques de l'avis si possible.
- Réponds uniquement avec le texte de la réponse, sans guillemets ni balises.`;

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
          { 
            role: "system", 
            content: "Tu es un assistant IA expert en relation client qui rédige des réponses aux avis Google de manière professionnelle, polie et naturelle en français."
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
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
    let aiResponse = data.choices?.[0]?.message?.content?.trim();
    console.log("AI response generated:", aiResponse?.substring(0, 100));

    if (!aiResponse) {
      throw new Error("No response generated");
    }

    // Clean up response - remove quotes if AI wrapped the response
    if (aiResponse.startsWith('"') && aiResponse.endsWith('"')) {
      aiResponse = aiResponse.slice(1, -1);
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
      description: `Réponse IA pour l'avis de ${review.author} (${businessName})`,
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
      message: `Une réponse a été générée pour l'avis de ${review.author} (${businessName})`,
      review_id: reviewId,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiResponse,
      credits_remaining: newCredits,
      business_used: businessName
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
