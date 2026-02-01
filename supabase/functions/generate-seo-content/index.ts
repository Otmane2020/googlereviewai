import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extraire la ville d'une adresse complète
function extractCityFromAddress(address: string | null): string {
  if (!address) return "";
  
  // Pattern français: "Rue X, Ville, CodePostal" ou "Rue X, CodePostal Ville"
  const parts = address.split(",").map(p => p.trim());
  
  for (const part of parts) {
    // Chercher une partie qui ressemble à une ville (pas de numéro de rue, pas de code postal seul)
    const cleaned = part.replace(/^\d{5}\s*/, "").replace(/\s*\d{5}$/, "").trim();
    if (cleaned && !cleaned.match(/^\d/) && cleaned.length > 2 && !cleaned.match(/^(rue|avenue|boulevard|place|allée|impasse|chemin)/i)) {
      return cleaned;
    }
  }
  
  // Fallback: prendre l'avant-dernière partie (souvent la ville)
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2].replace(/\d{5}/g, "").trim();
    if (candidate) return candidate;
  }
  
  return parts[0] || "";
}

// Scrape website using Firecrawl
async function scrapeWebsite(url: string): Promise<string | null> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    console.log("[Firecrawl] No API key configured, skipping website scrape");
    return null;
  }

  try {
    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`[Firecrawl] Scraping: ${formattedUrl}`);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl] Error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";
    
    // Limit content to ~3000 chars to avoid token limits
    const truncated = markdown.slice(0, 3000);
    console.log(`[Firecrawl] Success! Got ${markdown.length} chars, using ${truncated.length}`);
    
    return truncated;
  } catch (error) {
    console.error("[Firecrawl] Exception:", error);
    return null;
  }
}

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
      websiteUrl, // NEW: explicit website URL for scraping
      keywords, 
      singleQuestion,
      gmbDescription, // GMB profile description
      websiteContent, // NEW: pre-scraped content (optional)
      title, // For seo_article type
      count, // For article_titles type
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Scrape website if URL provided and no pre-scraped content
    let scrapedContent = websiteContent || null;
    const urlToScrape = websiteUrl || sourceUrl;
    
    if (!scrapedContent && urlToScrape && (type === "analyze_business" || type === "aeo_questions")) {
      console.log(`[generate-seo-content] Scraping website: ${urlToScrape}`);
      scrapedContent = await scrapeWebsite(urlToScrape);
    }

    // Combine all business context
    const fullContext = [
      businessDescription,
      gmbDescription,
      scrapedContent ? `\n--- CONTENU DU SITE WEB ---\n${scrapedContent}` : "",
    ].filter(Boolean).join("\n");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "analyze_business") {
      // Analyze business and generate keywords
      systemPrompt = `Tu es un expert en SEO local et marketing digital. Tu analyses les profils d'entreprises pour extraire des mots-clés pertinents et comprendre leur activité.
${scrapedContent ? "IMPORTANT: Utilise le contenu scrapé du site web pour générer des mots-clés PRÉCIS et PERTINENTS basés sur les vrais services/produits proposés." : ""}`;

      userPrompt = `Analyse cette entreprise et génère des mots-clés SEO pertinents:
Nom: ${businessName}
Description: ${businessDescription || "Non fournie"}
Localisation: ${location}
${urlToScrape ? `Site web: ${urlToScrape}` : ""}
${scrapedContent ? `\n--- CONTENU DU SITE WEB (IMPORTANT - utilise ces infos) ---\n${scrapedContent}\n--- FIN DU CONTENU ---` : ""}

IMPORTANT: Génère exactement ce JSON (pas de texte avant ou après):
{
  "description": "Description optimisée de l'entreprise en 2-3 phrases basée sur le contenu réel du site",
  "keywords": ["mot-clé 1", "mot-clé 2", ...],
  "categories": ["catégorie 1", "catégorie 2"]
}

Génère 30 mots-clés variés incluant:
- Mots-clés principaux du secteur d'activité ${scrapedContent ? "(basés sur le contenu scrapé)" : ""}
- Mots-clés locaux (avec la ville)
- Questions fréquentes des clients
- Services/produits spécifiques ${scrapedContent ? "MENTIONNÉS SUR LE SITE" : "mentionnés"}
- Variantes longue traîne`;

    } else if (type === "article_titles") {
      // Generate 30 article titles
      const numTitles = count || 30;
      const city = extractCityFromAddress(location);
      
      // Déterminer la région à partir de la ville (simplification)
      const getRegion = (cityName: string): string => {
        const regions: Record<string, string> = {
          "paris": "Île-de-France", "montreuil": "Île-de-France", "lognes": "Île-de-France",
          "lyon": "Rhône-Alpes", "marseille": "PACA", "toulouse": "Occitanie",
          "nantes": "Pays de la Loire", "bordeaux": "Nouvelle-Aquitaine",
          "lille": "Hauts-de-France", "strasbourg": "Grand Est", "nice": "PACA"
        };
        const cityLower = cityName.toLowerCase();
        for (const [key, region] of Object.entries(regions)) {
          if (cityLower.includes(key)) return region;
        }
        return "France";
      };
      
      const region = getRegion(city);
      
      systemPrompt = `Tu es un expert en SEO et marketing de contenu. Tu crées des titres d'articles UNIQUES et ORIGINAUX.

RÈGLES STRICTES:
- INTERDITS: "Où trouver...", "Découvrez...", "Les meilleurs..." en début de titre
- Chaque titre doit avoir un ANGLE UNIQUE (chiffre, comparatif, guide, erreur à éviter, tendance)
- Longueur: 50-70 caractères
- Varier les formats: questions, listes, guides, études de cas

RÈGLES DE LOCALISATION (TRÈS IMPORTANT):
- 30% des titres: avec la ville "${city}"
- 30% des titres: avec la région "${region}" ou "en France"
- 40% des titres: SANS localisation (sujets universels)
- JAMAIS le code postal dans un titre`;

      userPrompt = `Génère ${numTitles} titres d'articles SEO UNIQUES et VARIÉS pour:
Entreprise: ${businessName}
Secteur: ${fullContext || "Non précisé"}
Ville pour titres locaux: ${city}
Région: ${region}
${keywords?.length ? `Mots-clés: ${keywords.join(", ")}` : ""}

RÉPARTITION OBLIGATOIRE sur les ${numTitles} titres:
- ~${Math.round(numTitles * 0.3)} titres avec "${city}" (ex: "Guide des canapés à ${city}")
- ~${Math.round(numTitles * 0.3)} titres avec "${region}" ou "en France" (ex: "Tendances déco ${region} 2025")
- ~${Math.round(numTitles * 0.4)} titres SANS localisation (ex: "7 erreurs à éviter avant d'acheter un canapé")

TEMPLATES À VARIER:
1. CHIFFRES: "7 erreurs à éviter...", "Les 5 critères pour..."
2. QUESTIONS: "Combien coûte...?", "Quel est le meilleur moment pour...?"
3. COMPARATIFS: "X vs Y: lequel choisir?", "Différences entre..."
4. GUIDES: "Guide complet:", "Étape par étape:"
5. TENDANCES: "Tendances 2025:", "Ce qui change en..."
6. PROBLÈMES: "Comment résoudre...", "Que faire si..."

INTERDICTIONS ABSOLUES:
- Pas de "Où trouver" ou "Découvrez" en début
- Pas de titres génériques type "Les avantages de..."
- Pas de répétitions de structure
- PAS "${city}" dans tous les titres!

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
      const city = extractCityFromAddress(location);
      const existingQuestions = keywords?.slice(1) || []; // Les questions existantes passées après le premier mot-clé
      
      systemPrompt = `Tu es un expert en AEO (Answer Engine Optimization) pour ChatGPT, Gemini et Perplexity.

OBJECTIF: Créer des Q&A que les IA vont CITER dans leurs réponses.
${scrapedContent ? "\n⚠️ IMPORTANT: Tu as accès au CONTENU RÉEL du site web. Utilise ces informations pour créer des Q&A PRÉCIS et PERTINENTS basés sur les vrais services, produits et tarifs mentionnés." : ""}

FORMAT RÉPONSE OPTIMAL (60-80 mots MAX):
- Phrase 1: Fait/chiffre précis (prix moyen, délai, pourcentage) ${scrapedContent ? "EXTRAIT DU SITE SI DISPONIBLE" : ""}
- Phrase 2: Critère de choix ou contexte clé
- Phrase 3: Exemple avec ${businessName}

RÈGLES ANTI-GÉNÉRIQUE:
- JAMAIS commencer par "Chez ${businessName}..." ou "À ${city}..."
- TOUJOURS inclure un chiffre ou donnée vérifiable ${scrapedContent ? "(de préférence du site)" : ""}
- Réponse DIRECTE, pas de tournures promotionnelles
- Questions naturelles type conversation avec une IA`;

      const numQuestions = singleQuestion ? 1 : 5;
      const excludeList = existingQuestions.length > 0 
        ? `\n\nQUESTIONS À NE PAS RÉPÉTER:\n${existingQuestions.map((q: string) => `- ${q}`).join("\n")}` 
        : "";
      
      userPrompt = `Génère ${numQuestions} paire(s) question-réponse AEO pour:
Entreprise: ${businessName}
Activité: ${businessDescription || "Non précisé"}
Ville: ${city || location}
${keywords?.length ? `Mot-clé: ${keywords[0]}` : ""}
${scrapedContent ? `\n--- CONTENU DU SITE WEB (UTILISE CES INFOS RÉELLES) ---\n${scrapedContent}\n--- FIN DU CONTENU ---` : ""}
${excludeList}

CATÉGORIES À VARIER:
- prix: "Combien coûte...", "Quel budget pour..."
- délais: "Combien de temps...", "Quel délai pour..."
- choix: "Comment choisir...", "Quels critères pour..."
- qualité: "Comment reconnaître...", "Quels signes de..."
- local: "Où trouver à ${city}...", "Y a-t-il... près de..."

EXEMPLES DE BONNES RÉPONSES:
❌ "Chez ${businessName}, vous trouverez une large gamme de produits de qualité..."
✅ "Le prix moyen d'un canapé 3 places varie entre 800€ et 2500€ selon les matériaux. Privilégiez les tissus anti-taches pour les familles. ${businessName} à ${city} propose des modèles dès 650€ avec garantie 5 ans."

IMPORTANT: Réponds UNIQUEMENT en JSON valide:
{
  "questions": [
    {
      "question": "Question naturelle type ChatGPT",
      "answer": "Réponse 60-80 mots avec chiffre + contexte + exemple ${businessName}",
      "category": "prix|délais|choix|qualité|local"
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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
