import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callOpenRouterWithFallback } from "../_shared/openrouter.ts";
import { sendFreeUpgradeEmail } from "../_shared/free-upgrade.ts";
import { hasUnlimitedAiReplies } from "../_shared/plan-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Language-specific content
const translations = {
  fr: {
    ourEstablishment: "Notre établissement",
    signature: "— L'équipe",
    responseGenerated: "Réponse IA générée",
    responseFor: "Réponse générée pour l'avis de",
    insufficientCredits: "Crédits insuffisants. Rechargez votre compte pour continuer.",
    rateLimited: "Limite de requêtes atteinte, réessayez dans quelques secondes.",
    creditsExhausted: "Crédits Lovable AI épuisés.",
    usage: "usage",
    aiResponseFor: "Réponse IA pour",
    lengthMap: {
      S: "1 à 2 phrases courtes (20-40 mots)",
      M: "2 à 4 phrases (40-80 mots)",
      L: "4 à 6 phrases (80-150 mots)",
    },
    toneMap: {
      friendly: "amical et chaleureux",
      professional: "professionnel et formel",
      casual: "décontracté et naturel",
      empathetic: "empathique et compréhensif",
      humorous: "léger avec une touche d'humour tout en restant respectueux",
      warm: "chaleureux et bienveillant",
    },
    positiveStrategy: "C'est un avis positif. Exprime ta gratitude chaleureusement et encourage le client à revenir.",
    neutralStrategy: "C'est un avis mitigé. Remercie le client, reconnais les points à améliorer et montre ta volonté de faire mieux.",
    negativeStrategy: "C'est un avis négatif. Montre de l'empathie, présente des excuses sincères et propose une solution ou un geste commercial.",
    noComment: "Aucun commentaire",
    promptIntro: "Tu es un assistant qui répond aux avis Google My Business pour",
    rules: "Règles",
    thankCustomer: "Remercier le client.",
    length: "Longueur",
    tone: "Ton",
    instructions: "Instructions",
    signatureLabel: "Signature",
    important: "IMPORTANT : Ne pas commencer par \"Cher client\" ou \"Bonjour\". Personnalise la réponse. Réponds UNIQUEMENT avec le texte, sans guillemets.",
  },
  en: {
    ourEstablishment: "Our establishment",
    signature: "— The team at",
    responseGenerated: "AI response generated",
    responseFor: "Response generated for review by",
    insufficientCredits: "Insufficient credits. Top up your account to continue.",
    rateLimited: "Rate limit reached, please try again in a few seconds.",
    creditsExhausted: "Lovable AI credits exhausted.",
    usage: "usage",
    aiResponseFor: "AI response for",
    lengthMap: {
      S: "1 to 2 short sentences (20-40 words)",
      M: "2 to 4 sentences (40-80 words)",
      L: "4 to 6 sentences (80-150 words)",
    },
    toneMap: {
      friendly: "friendly and warm",
      professional: "professional and formal",
      casual: "casual and natural",
      empathetic: "empathetic and understanding",
      humorous: "light with a touch of humor while remaining respectful",
      warm: "warm and caring",
    },
    positiveStrategy: "This is a positive review. Express your gratitude warmly and encourage the customer to return.",
    neutralStrategy: "This is a mixed review. Thank the customer, acknowledge areas for improvement and show willingness to do better.",
    negativeStrategy: "This is a negative review. Show empathy, offer sincere apologies and propose a solution or goodwill gesture.",
    noComment: "No comment",
    promptIntro: "You are an assistant responding to Google My Business reviews for",
    rules: "Rules",
    thankCustomer: "Thank the customer.",
    length: "Length",
    tone: "Tone",
    instructions: "Instructions",
    signatureLabel: "Signature",
    important: "IMPORTANT: Do not start with \"Dear customer\" or \"Hello\". Personalize the response. Reply ONLY with the text, no quotes.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId, businessId, language: requestLanguage } = await req.json();

    // OpenRouter is preferred, but the shared AI caller already supports a
    // second provider. Never reject generation before trying that fallback.
    // Missing both providers is reported clearly by the AI caller.

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Derive userId exclusively from a validated session, not the browser body.
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || token === authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;
    console.log("Generating AI response for review:", reviewId, "user:", userId);

    // Parallel fetch: profile, review, and AI settings
    const [profileResult, reviewResult, aiSettingsResult] = await Promise.all([
      supabase.from("profiles").select("credits, plan_name, plan_id, subscription_status, current_period_end, trial_end, preferred_language").eq("id", userId).single(),
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

    // Enforce membership of a managed Google location. A review can contain
    // a resource path (accounts/.../locations/ID) or just the bare location ID;
    // compare normalized IDs and never use a user-supplied businessId as proof.
    if (review && !reviewResult.error) {
      const locationId = String(review.location_id || "").split("/").filter(Boolean).pop();
      const { data: managedLocations, error: managedError } = await supabase
        .from("businesses")
        .select("id,google_place_id")
        .eq("user_id", userId)
        .eq("is_active", true);
      if (managedError) throw managedError;
      const managedBusiness = (managedLocations || []).find(b =>
        String(b.google_place_id || "").split("/").filter(Boolean).pop() === locationId
      );
      if (!managedBusiness) {
        return new Response(JSON.stringify({ error: "Cet avis ne fait pas partie de vos établissements actifs.", code: "LOCATION_NOT_MANAGED" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Determine language: request param > profile > default
    const lang = requestLanguage || profile?.preferred_language || "fr";
    const t = translations[lang as keyof typeof translations] || translations.fr;

    const unlimitedReplies = hasUnlimitedAiReplies(profile);
    if (!profile || (!unlimitedReplies && profile.credits < 1)) {
      if (profile) await sendFreeUpgradeEmail(supabase, userId, supabaseUrl, supabaseKey);
      return new Response(
        JSON.stringify({
          error: t.insufficientCredits,
          code: "UPGRADE_REQUIRED", upgrade_required: true,
          credits: profile?.credits || 0
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reviewResult.error || !review) {
      console.error("Review fetch error:", reviewResult.error);
      throw new Error("Review not found");
    }

    // Fetch business with brand voice profile (might need location_id fallback)
    let business = null;
    if (businessId) {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, description, gmb_language, ai_response_model")
        .eq("id", businessId)
        .eq("user_id", userId)
        .single();
      business = data;
    }
    
    if (!business && review.location_id) {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, description, gmb_language, ai_response_model")
        .eq("google_place_id", String(review.location_id).split("/").filter(Boolean).pop() || "")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      business = data;
    }

    // Use GMB language if available, otherwise use profile language
    const responseLanguage = business?.gmb_language || lang;
    const responseT = translations[responseLanguage as keyof typeof translations] || translations.fr;

    const businessName = business?.name || t.ourEstablishment;
    const businessDescription = business?.description || "";
    
    // Get brand voice profile if available
    const brandVoice = business?.ai_response_model as {
      tone?: string;
      formality?: string;
      length?: string;
      emojis?: boolean;
      emoji_list?: string[];
      structure?: string[];
      signature_style?: string;
      keywords?: string[];
      recurring_phrases?: string[];
    } | null;

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
      signature = `${responseT.signature} ${businessName}`;
    }

    // Length and tone instructions
    const lengthInstruction = responseT.lengthMap[responseLength as keyof typeof responseT.lengthMap] || responseT.lengthMap.M;
    const toneInstruction = responseT.toneMap[tone as keyof typeof responseT.toneMap] || responseT.toneMap.friendly;

    // Rating strategy
    let ratingStrategy = "";
    if (review.rating >= 4) {
      ratingStrategy = responseT.positiveStrategy;
    } else if (review.rating === 3) {
      ratingStrategy = responseT.neutralStrategy;
    } else {
      ratingStrategy = responseT.negativeStrategy;
    }

    // Build brand voice context if profile exists
    let brandVoiceContext = "";
    if (brandVoice && brandVoice.tone) {
      brandVoiceContext = `
STYLE DU GÉRANT (à respecter impérativement):
- Ton: ${brandVoice.tone}
- Niveau de formalité: ${brandVoice.formality || "semi-formel"}
- Longueur habituelle: ${brandVoice.length || "moyenne"}
${brandVoice.emojis ? `- Utilise des emojis: ${brandVoice.emoji_list?.join(" ") || "oui"}` : "- Pas d'emojis"}
- Structure typique: ${brandVoice.structure?.join(" → ") || "remerciement → réponse → invitation"}
${brandVoice.signature_style ? `- Formule de clôture: "${brandVoice.signature_style}"` : ""}
${brandVoice.keywords?.length ? `- Vocabulaire favori: ${brandVoice.keywords.join(", ")}` : ""}
${brandVoice.recurring_phrases?.length ? `- Expressions récurrentes: "${brandVoice.recurring_phrases.join('", "')}"` : ""}

IMPORTANT: Imite exactement ce style pour que la réponse semble écrite par la même personne.
`;
    }

    // Build prompt in the target language
    const prompt = `${responseT.promptIntro} ${businessName}.
${businessDescription ? `Context: ${businessDescription}` : ""}
${brandVoiceContext}
Review:
- Author: ${review.author}
- Rating: ${review.rating}/5
- Comment: "${review.comment || responseT.noComment}"

${responseT.rules}:
1. ${responseT.thankCustomer}
2. ${ratingStrategy}
${!brandVoice ? `3. ${responseT.length}: ${lengthInstruction}.
4. ${responseT.tone}: ${toneInstruction}.` : "3. Respecte le style du gérant défini ci-dessus."}
${customTemplate ? `${brandVoice ? "4" : "5"}. ${responseT.instructions}: ${customTemplate}` : ""}
${signature && !brandVoice?.signature_style ? `${brandVoice ? "5" : "6"}. ${responseT.signatureLabel}: "${signature}"` : ""}

${responseT.important}`;

    console.log("Calling OpenRouter (with fallback)... Language:", responseLanguage);

    let aiResponse: string;
    try {
      aiResponse = (await callOpenRouterWithFallback({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 250,
        // Restrict this short review task to two fast endpoints before trying
        // the gateway fallback. A hung provider must not block the user.
        models: ["deepseek/deepseek-chat", "google/gemini-2.5-flash-lite"],
        request_timeout_ms: 12000,
      })).trim();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("OpenRouter all-models error:", msg);
      if (msg.includes("429")) {
        return new Response(JSON.stringify({ error: t.rateLimited }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // No credits are debited on generation failure. Return a useful code
      // without exposing provider keys or untrusted upstream response bodies.
      return new Response(JSON.stringify({
        error: "Service de génération IA momentanément indisponible. Veuillez réessayer.",
        code: "AI_PROVIDER_UNAVAILABLE",
      }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("AI response generated:", aiResponse?.substring(0, 80));

    if (!aiResponse) {
      throw new Error("No response generated");
    }

    // Clean response
    if (aiResponse.startsWith('"') && aiResponse.endsWith('"')) {
      aiResponse = aiResponse.slice(1, -1);
    }

    // A single DB transaction verifies review ownership and atomically
    // consumes a credit; concurrent requests cannot overspend the balance.
    let newCredits = profile.credits;
    if (unlimitedReplies) {
      // Pro/Business explicitly include unlimited replies. Do not debit their
      // separate credit balance for ordinary Google review responses.
      const { error: writeError } = await supabase.from("reviews")
        .update({ ai_response: aiResponse, needs_new_response: false })
        .eq("id", reviewId).eq("user_id", userId);
      if (writeError) throw writeError;
    } else {
      const { data: remaining, error: debitError } = await supabase.rpc("consume_review_ai_credit", {
        p_user_id: userId,
        p_review_id: reviewId,
        p_response: aiResponse,
        p_description: `${t.aiResponseFor} ${review.author}`,
      });
      if (debitError) throw debitError;
      newCredits = typeof remaining === "number" ? remaining : -1;
    }
    if (!unlimitedReplies && (typeof newCredits !== "number" || newCredits < 0)) {
      await sendFreeUpgradeEmail(supabase, userId, supabaseUrl, supabaseKey);
      return new Response(JSON.stringify({
        error: t.insufficientCredits, code: "UPGRADE_REQUIRED",
        upgrade_required: true, credits_remaining: 0,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "ai_response",
      title: t.responseGenerated,
      message: `${t.responseFor} ${review.author}`,
      review_id: reviewId,
    });
    if (!unlimitedReplies && newCredits === 0) {
      await sendFreeUpgradeEmail(supabase, userId, supabaseUrl, supabaseKey);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiResponse,
      credits_remaining: newCredits,
      language: responseLanguage,
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
