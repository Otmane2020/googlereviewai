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
    const { 
      type, 
      businessName, 
      businessDescription, 
      location, 
      sourceUrl, 
      keywords, 
      singleQuestion,
      gmbDescription, // GMB profile description
      title, // For seo_article type
      count, // For article_titles type
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Combine all business context
    const fullContext = [
      businessDescription,
      gmbDescription,
    ].filter(Boolean).join("\n");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "analyze_business") {
      // Analyze business and generate keywords
      systemPrompt = `Tu es un expert en SEO local et marketing digital. Tu analyses les profils d'entreprises pour extraire des mots-clés pertinents et comprendre leur activité.`;

      userPrompt = `Analyse cette entreprise et génère des mots-clés SEO pertinents:
Nom: ${businessName}
Description: ${fullContext || "Non fournie"}
Localisation: ${location}
${sourceUrl ? `Site web: ${sourceUrl}` : ""}

IMPORTANT: Génère exactement ce JSON (pas de texte avant ou après):
{
  "description": "Description optimisée de l'entreprise en 2-3 phrases",
  "keywords": ["mot-clé 1", "mot-clé 2", ...],
  "categories": ["catégorie 1", "catégorie 2"]
}

Génère 30 mots-clés variés incluant:
- Mots-clés principaux du secteur d'activité
- Mots-clés locaux (avec la ville)
- Questions fréquentes des clients
- Services/produits spécifiques mentionnés
- Variantes longue traîne`;

    } else if (type === "article_titles") {
      // Generate 30 article titles
      const numTitles = count || 30;
      systemPrompt = `Tu es un expert en SEO et marketing de contenu. Tu crées des titres d'articles optimisés pour le référencement local et l'engagement.

Règles pour les titres:
- Titres accrocheurs et optimisés SEO
- Incluent des mots-clés naturellement
- Variés: guides, comparatifs, conseils, actualités locales
- Longueur: 50-70 caractères idéalement
- Pertinents pour l'activité et la localisation`;

      userPrompt = `Génère ${numTitles} titres d'articles SEO uniques pour:
Entreprise: ${businessName}
Description: ${fullContext}
Localisation: ${location}
${keywords?.length ? `Mots-clés: ${keywords.join(", ")}` : ""}

Types de titres à inclure:
- Guides pratiques ("Comment...", "Guide complet...")
- Conseils et astuces ("5 conseils pour...", "Les meilleures...")
- Questions fréquentes ("Pourquoi...", "Quand...")
- Actualités locales ("Nouveau à ${location}...")
- Comparatifs ("vs", "avantages de...")

IMPORTANT: Réponds UNIQUEMENT en JSON valide:
{
  "titles": ["Titre 1", "Titre 2", "Titre 3", ...]
}`;

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
Description: ${fullContext}
Localisation: ${location}
${title ? `Titre de l'article: ${title}` : ""}
${sourceUrl ? `URL source: ${sourceUrl}` : ""}
${keywords?.length ? `Mots-clés: ${keywords.join(", ")}` : ""}

Génère un article complet avec:
1. ${title ? `Garde le titre: "${title}"` : "Titre accrocheur (H1)"}
2. Meta description (max 155 caractères)
3. Contenu structuré en markdown
4. Conclusion avec CTA

Réponds en JSON:
{
  "article": {
    "title": "${title || "Titre de l'article"}",
    "meta_description": "Description meta de 155 caractères max",
    "content": "Contenu complet en markdown avec H2, H3, listes..."
  }
}`;

    } else if (type === "aeo_questions") {
      systemPrompt = `Tu es un expert en AEO (Answer Engine Optimization) et optimisation pour ChatGPT/Gemini/Perplexity.

Tu crées des paires question-réponse optimisées pour être CITÉES par les IA:

RÈGLES CRITIQUES:
1. La réponse DOIT commencer par la réponse directe (pas "Chez ${businessName}...")
2. Inclure des chiffres/données concrètes quand possible
3. Réponse en 2-4 phrases maximum (60-100 mots)
4. Le nom de l'entreprise apparaît EN FIN de réponse comme exemple
5. Format facilement extractable par une IA`;

      const numQuestions = singleQuestion ? 1 : 5;
      userPrompt = `Génère ${numQuestions} paire(s) question-réponse AEO pour:
Entreprise: ${businessName}
Description: ${fullContext}
Localisation: ${location}
${keywords?.length ? `Mot-clé principal: ${keywords[0]}` : ""}

STRUCTURE DE RÉPONSE AEO OPTIMALE:
- Phrase 1: Réponse directe avec chiffre/fait
- Phrase 2: Contexte ou critère important
- Phrase 3: Mention de ${businessName} comme exemple concret

IMPORTANT: Réponds uniquement en JSON valide:
{
  "questions": [
    {
      "question": "Question naturelle que poserait un utilisateur à ChatGPT",
      "answer": "Réponse directe et factuelle. Contexte. Chez ${businessName}, [exemple concret].",
      "category": "services|horaires|localisation|avis|prix|contact"
    }
  ]
}`;
    }

    console.log(`[generate-seo-content] Type: ${type}, Business: ${businessName}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log(`[generate-seo-content] AI response length: ${content.length}`);

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
          console.log(`[generate-seo-content] Extracted ${result.keywords.length} keywords`);
        } else {
          result = { description: "", keywords: [], categories: [] };
        }
      } catch (e) {
        console.error("[generate-seo-content] Parse error:", e);
        result = { description: "", keywords: [], categories: [] };
      }
    } else if (type === "article_titles") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*"titles"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = { titles: parsed.titles || [] };
          console.log(`[generate-seo-content] Generated ${result.titles.length} titles`);
        } else {
          // Fallback: try to extract titles from lines
          const lines = content.split('\n').filter((l: string) => l.trim().length > 10);
          result = { titles: lines.slice(0, 30) };
        }
      } catch (e) {
        console.error("[generate-seo-content] Parse error:", e);
        result = { titles: [], raw: content };
      }
    } else if (type === "seo_article") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*"article"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = {
            article: {
              title: parsed.article?.title || businessName,
              meta_description: parsed.article?.meta_description?.slice(0, 160) || "",
              content: parsed.article?.content || content,
            }
          };
        } else {
          // Fallback: extract from markdown
          const titleMatch = content.match(/^#\s+(.+)$/m);
          result = {
            article: {
              title: titleMatch ? titleMatch[1].trim() : businessName,
              meta_description: "",
              content: content,
            }
          };
        }
      } catch (e) {
        console.error("[generate-seo-content] Parse error:", e);
        result = {
          article: {
            title: businessName,
            content: content,
          }
        };
      }
    } else if (type === "aeo_questions") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = { questions: parsed.questions || [] };
          console.log(`[generate-seo-content] Generated ${result.questions.length} Q&A`);
        } else {
          result = { questions: [], raw: content };
        }
      } catch (e) {
        console.error("[generate-seo-content] Parse error:", e);
        result = { questions: [], raw: content };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[generate-seo-content] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
