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
    console.log("Generating AI response for review:", reviewId, "user:", userId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parallel fetch: profile, review, and AI settings
    const [profileResult, reviewResult, aiSettingsResult] = await Promise.all([
      supabase.from("profiles").select("credits, plan_name").eq("id", userId).single(),
      supabase.from("reviews").select("*").eq("id", reviewId).eq("user_id", userId).single(),
      supabase.from("ai_settings").select("*").eq("user_id", userId).single(),
    ]);

    const profile = profileResult.data;
    const review = reviewResult.data;
    const aiSettings = aiSettingsResult.data;

    if (profileResult.error) {
      console.error("Profile fetch error:", profileResult.error);
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

    if (reviewResult.error || !review) {
      console.error("Review fetch error:", reviewResult.error);
      throw new Error("Review not found");
    }

    // Fetch business (might need location_id fallback)
    let business = null;
    if (businessId) {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, description")
        .eq("id", businessId)
        .eq("user_id", userId)
        .single();
      business = data;
    }
    
    if (!business && review.location_id) {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, description")
        .eq("google_place_id", review.location_id)
        .eq("user_id", userId)
        .single();
      business = data;
    }

    const businessName = business?.name || "Notre établissement";
    const businessDescription = business?.description || "";

    const tone = aiSettings?.tone || "friendly";
    const responseLength = aiSettings?.response_length || "M";
    const includeSignature = aiSettings?.include_signature ?? true;
    const customTemplate = aiSettings?.custom_template || "";
    
    // Build signature
    let signature = "";
    if (includeSignature && aiSettings?.signature) {
      signature = aiSettings.signature
        .replace("{business_name}", businessName)
        .replace("{nom_etablissement}", businessName);
    } else if (includeSignature) {
      signature = `— L'équipe ${businessName}`;
    }

    // Length and tone instructions
    const lengthMap: Record<string, string> = {
      S: "1 à 2 phrases courtes (20-40 mots)",
      M: "2 à 4 phrases (40-80 mots)",
      L: "4 à 6 phrases (80-150 mots)",
    };
    const lengthInstruction = lengthMap[responseLength] || "2 à 4 phrases (40-80 mots)";

    const toneMap: Record<string, string> = {
      friendly: "amical et chaleureux",
      professional: "professionnel et formel",
      casual: "décontracté et naturel",
      empathetic: "empathique et compréhensif",
      humorous: "léger avec une touche d'humour tout en restant respectueux",
      warm: "chaleureux et bienveillant",
    };
    const toneInstruction = toneMap[tone] || "amical et professionnel";

    // Rating strategy
    let ratingStrategy = "";
    if (review.rating >= 4) {
      ratingStrategy = "C'est un avis positif. Exprime ta gratitude chaleureusement et encourage le client à revenir.";
    } else if (review.rating === 3) {
      ratingStrategy = "C'est un avis mitigé. Remercie le client, reconnais les points à améliorer et montre ta volonté de faire mieux.";
    } else {
      ratingStrategy = "C'est un avis négatif. Montre de l'empathie, présente des excuses sincères et propose une solution ou un geste commercial.";
    }

    const prompt = `Tu es un assistant qui répond aux avis Google My Business pour ${businessName}.
${businessDescription ? `Contexte : ${businessDescription}` : ""}

Avis :
- Auteur : ${review.author}
- Note : ${review.rating}/5
- Commentaire : "${review.comment || "Aucun commentaire"}"

Règles :
1. Remercier le client.
2. ${ratingStrategy}
3. Longueur : ${lengthInstruction}.
4. Ton : ${toneInstruction}.
${customTemplate ? `5. Instructions : ${customTemplate}` : ""}
${signature ? `6. Signature : "${signature}"` : ""}

IMPORTANT : Ne pas commencer par "Cher client" ou "Bonjour". Personnalise la réponse. Réponds UNIQUEMENT avec le texte, sans guillemets.`;

    console.log("Calling Lovable AI Gateway...");
    
    // Use Lovable AI Gateway (faster than OpenRouter)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "Tu es un assistant IA expert en relation client qui rédige des réponses aux avis Google de manière professionnelle et naturelle en français."
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques secondes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits Lovable AI épuisés." }), {
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
    console.log("AI response generated:", aiResponse?.substring(0, 80));

    if (!aiResponse) {
      throw new Error("No response generated");
    }

    // Clean response
    if (aiResponse.startsWith('"') && aiResponse.endsWith('"')) {
      aiResponse = aiResponse.slice(1, -1);
    }

    // Parallel updates: deduct credit, log history, update review, create notification
    const newCredits = profile.credits - 1;
    
    await Promise.all([
      supabase.from("profiles").update({ credits: newCredits }).eq("id", userId),
      supabase.from("credits_history").insert({
        user_id: userId,
        amount: -1,
        type: "usage",
        description: `Réponse IA pour ${review.author}`,
      }),
      supabase.from("reviews").update({ ai_response: aiResponse }).eq("id", reviewId),
      supabase.from("notifications").insert({
        user_id: userId,
        type: "ai_response",
        title: "Réponse IA générée",
        message: `Réponse générée pour l'avis de ${review.author}`,
        review_id: reviewId,
      }),
    ]);

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiResponse,
      credits_remaining: newCredits,
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
