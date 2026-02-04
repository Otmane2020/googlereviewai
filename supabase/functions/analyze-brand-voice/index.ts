import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandVoiceProfile {
  tone: string;
  formality: string;
  length: string;
  emojis: boolean;
  emoji_list: string[];
  structure: string[];
  signature_style: string;
  keywords: string[];
  recurring_phrases: string[];
  language: string;
  analyzed_responses_count: number;
  last_analyzed_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, businessId } = await req.json();
    console.log("[AnalyzeBrandVoice] Starting analysis for business:", businessId);

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get business info
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, google_place_id, gmb_language")
      .eq("id", businessId)
      .eq("user_id", userId)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found");
    }

    // Get all reviews with existing Google replies (manager's responses)
    // These are the authentic responses written by the manager
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("google_reply, rating, comment, author")
      .eq("user_id", userId)
      .eq("location_id", business.google_place_id)
      .not("google_reply", "is", null)
      .order("review_date", { ascending: false })
      .limit(50);

    if (reviewsError) {
      console.error("[AnalyzeBrandVoice] Error fetching reviews:", reviewsError);
      throw new Error("Failed to fetch reviews");
    }

    const managerResponses = reviews?.filter(r => r.google_reply && r.google_reply.trim().length > 10) || [];
    
    if (managerResponses.length < 3) {
      return new Response(
        JSON.stringify({ 
          error: "Pas assez de réponses existantes pour analyser le style (minimum 3 requises)",
          responses_found: managerResponses.length
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AnalyzeBrandVoice] Found ${managerResponses.length} manager responses to analyze`);

    // Prepare the responses for analysis
    const responsesText = managerResponses
      .slice(0, 30) // Limit to 30 for analysis
      .map((r, i) => `Réponse ${i + 1} (avis ${r.rating}★):\n"${r.google_reply}"`)
      .join("\n\n");

    // Call OpenRouter to analyze the style
    const analysisPrompt = `Tu es un expert en analyse linguistique et marketing. Analyse les réponses suivantes d'un gérant d'établissement aux avis Google et identifie son style d'écriture unique.

RÉPONSES DU GÉRANT À ANALYSER:
${responsesText}

ANALYSE REQUISE:
Examine attentivement ces réponses et identifie:

1. TON GÉNÉRAL: (chaleureux/professionnel/amical/formel/décontracté/enthousiaste)
2. NIVEAU DE FORMALITÉ: (très formel/semi-formel/informel/familier)
3. LONGUEUR MOYENNE: (très courte/courte/moyenne/longue)
4. UTILISATION D'EMOJIS: (oui/non, et lesquels si oui)
5. STRUCTURE RÉCURRENTE: (ex: remerciement en début, référence au service, invitation à revenir, signature)
6. STYLE DE SIGNATURE: (comment le gérant termine ses réponses)
7. MOTS-CLÉS FAVORIS: (mots ou expressions fréquemment utilisés)
8. PHRASES RÉCURRENTES: (formules qui reviennent souvent)

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après:

{
  "tone": "description du ton en 2-3 mots",
  "formality": "niveau de formalité",
  "length": "courte/moyenne/longue",
  "emojis": true ou false,
  "emoji_list": ["liste", "des", "emojis", "utilisés"],
  "structure": ["étape1", "étape2", "étape3"],
  "signature_style": "formule de clôture habituelle",
  "keywords": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "recurring_phrases": ["phrase1", "phrase2", "phrase3"]
}`;

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
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AnalyzeBrandVoice] OpenRouter error:", response.status, errorText);
      throw new Error("Failed to analyze brand voice");
    }

    const data = await response.json();
    let analysisText = data.choices?.[0]?.message?.content?.trim();
    
    if (!analysisText) {
      throw new Error("No analysis generated");
    }

    // Clean and parse JSON response
    // Remove markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let brandVoice: BrandVoiceProfile;
    try {
      const parsed = JSON.parse(analysisText);
      brandVoice = {
        tone: parsed.tone || "professionnel et chaleureux",
        formality: parsed.formality || "semi-formel",
        length: parsed.length || "moyenne",
        emojis: parsed.emojis === true,
        emoji_list: Array.isArray(parsed.emoji_list) ? parsed.emoji_list : [],
        structure: Array.isArray(parsed.structure) ? parsed.structure : ["remerciement", "réponse personnalisée", "invitation à revenir"],
        signature_style: parsed.signature_style || "",
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        recurring_phrases: Array.isArray(parsed.recurring_phrases) ? parsed.recurring_phrases : [],
        language: business.gmb_language || "fr",
        analyzed_responses_count: managerResponses.length,
        last_analyzed_at: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error("[AnalyzeBrandVoice] Failed to parse AI response:", analysisText);
      throw new Error("Failed to parse brand voice analysis");
    }

    console.log("[AnalyzeBrandVoice] Brand voice profile:", JSON.stringify(brandVoice));

    // Save the brand voice profile to the business
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ ai_response_model: brandVoice })
      .eq("id", businessId);

    if (updateError) {
      console.error("[AnalyzeBrandVoice] Failed to save profile:", updateError);
      throw new Error("Failed to save brand voice profile");
    }

    console.log("[AnalyzeBrandVoice] Profile saved successfully for business:", businessId);

    return new Response(
      JSON.stringify({
        success: true,
        brand_voice: brandVoice,
        responses_analyzed: managerResponses.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AnalyzeBrandVoice] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
