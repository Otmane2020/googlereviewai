import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callOpenRouterWithFallback } from "../_shared/openrouter.ts";
import { defaultReviewSignature, ensureReviewSignature } from "../_shared/review-signature.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { review, businessName } = await req.json();
    
    if (!review || !businessName) {
      throw new Error("review and businessName are required");
    }

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const signature = defaultReviewSignature(businessName, "fr");
    const systemPrompt = `Tu es un assistant qui génère des réponses professionnelles aux avis Google pour "${businessName}".

Règles:
- Réponse courte (2-3 phrases max)
- Ton professionnel et chaleureux
- Remercie toujours le client
- Si avis positif: valorise le feedback
- Si avis négatif: excuse-toi et propose de résoudre
- N'invente jamais de détails
- Termine par EXACTEMENT cette signature : "${signature}". N'ajoute ni catégorie commerciale ni description de la fiche Google à la signature.`;

    const userPrompt = `Génère une réponse pour cet avis:
Note: ${review.rating}/5 étoiles
Auteur: ${review.author_name}
Commentaire: ${review.text || "(Aucun commentaire)"}`;

    console.log(`[generate-demo-response] Generating for ${businessName}, rating: ${review.rating}`);

    const aiResponse = (await callOpenRouterWithFallback({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
      apiKey: openrouterKey,
    })).trim();

    if (!aiResponse) {
      throw new Error("No response generated");
    }

    const signedResponse = ensureReviewSignature(aiResponse, signature);
    console.log(`[generate-demo-response] Generated response: ${signedResponse.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ response: signedResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[generate-demo-response] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
