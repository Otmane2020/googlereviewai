import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, businessName, businessDescription, location, sourceUrl, keywords, singleQuestion } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "analyze_business") {
      // Analyze business and generate keywords
      systemPrompt = `Tu es un expert en SEO local et marketing digital. Tu analyses les profils d'entreprises pour extraire des mots-clés pertinents.`;

      userPrompt = `Analyse cette entreprise et génère des mots-clés SEO pertinents:
Nom: ${businessName}
Description: ${businessDescription || "Non fournie"}
Localisation: ${location}

Génère exactement ce JSON:
{
  "description": "Description optimisée de l'entreprise en 2-3 phrases",
  "keywords": ["mot-clé 1", "mot-clé 2", ...],
  "categories": ["catégorie 1", "catégorie 2"]
}

Génère 30 mots-clés variés incluant:
- Mots-clés principaux du secteur
- Mots-clés locaux (avec la ville)
- Questions fréquentes des clients
- Services/produits spécifiques`;

    } else if (type === "seo_article") {
      systemPrompt = `Tu es un expert en SEO et rédaction web. Tu crées des articles optimisés pour le référencement local.
      
Règles importantes:
- Écris en français avec un ton professionnel mais accessible
- Utilise les mots-clés naturellement (densité 2-3%)
- Structure avec H2 et H3
- Inclus des listes à puces quand pertinent
- Longueur: 800-1200 mots
- Optimise pour la recherche locale
- Ajoute un appel à l'action à la fin`;

      userPrompt = `Crée un article SEO pour:
Entreprise: ${businessName}
Description: ${businessDescription}
Localisation: ${location}
${sourceUrl ? `URL source: ${sourceUrl}` : ""}
${keywords?.length ? `Mots-clés: ${keywords.join(", ")}` : ""}

Génère un article complet avec:
1. Titre accrocheur (H1)
2. Meta description (max 155 caractères)
3. Contenu structuré
4. Conclusion avec CTA`;

    } else if (type === "aeo_questions") {
      systemPrompt = `Tu es un expert en AEO (Answer Engine Optimization) et optimisation pour ChatGPT/AI.
      
Tu dois créer des paires question-réponse qui:
- Répondent aux questions que les utilisateurs posent aux assistants IA
- Sont concises et directes (réponse en 2-4 phrases)
- Incluent le nom de l'entreprise naturellement
- Sont optimisées pour apparaître dans les réponses des IA comme ChatGPT, Perplexity, etc.`;

      const numQuestions = singleQuestion ? 1 : 5;
      userPrompt = `Génère ${numQuestions} paire(s) question-réponse AEO pour:
Entreprise: ${businessName}
Description: ${businessDescription}
Localisation: ${location}
${keywords?.length ? `Mot-clé principal: ${keywords[0]}` : ""}

Format attendu (JSON):
{
  "questions": [
    {"question": "...", "answer": "...", "category": "..."},
    ...
  ]
}

Catégories possibles: services, horaires, localisation, avis, prix, contact`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits AI épuisés. Ajoutez des crédits à votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the response based on type
    let result: any = { content };

    if (type === "analyze_business") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = {
            description: parsed.description || "",
            keywords: parsed.keywords || [],
            categories: parsed.categories || [],
          };
        } else {
          result = { description: "", keywords: [], categories: [] };
        }
      } catch {
        result = { description: "", keywords: [], categories: [] };
      }
    } else if (type === "seo_article") {
      // Extract title and meta description
      const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^(.+)\n/);
      const metaMatch = content.match(/Meta description:\s*(.+?)(?:\n|$)/i) || 
                       content.match(/\*\*Meta description\*\*:\s*(.+?)(?:\n|$)/i);
      
      result = {
        title: titleMatch ? titleMatch[1].trim() : businessName,
        meta_description: metaMatch ? metaMatch[1].trim().slice(0, 160) : "",
        content: content,
        keywords: keywords || [],
      };
    } else if (type === "aeo_questions") {
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = { questions: parsed.questions };
        } else {
          result = { questions: [], raw: content };
        }
      } catch {
        result = { questions: [], raw: content };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-seo-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
