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

// NO MORE Firecrawl here - content should be pre-scraped and passed via websiteContent parameter

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
      language, // NEW: language for content generation (from GMB)
    } = await req.json();
    
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Determine content language (default to French)
    const contentLang = language?.toLowerCase()?.startsWith("en") ? "en" : "fr";
    console.log(`[generate-seo-content] Language: ${contentLang}`);

    // Language-specific prompts
    const langConfig = {
      fr: {
        intro: "Tu es un expert en SEO et marketing digital français.",
        analyzeIntro: "Tu es un expert en SEO local et marketing digital. Tu analyses les profils d'entreprises pour extraire des mots-clés pertinents et comprendre leur activité.",
        articleIntro: "Tu es un expert en SEO et rédaction web. Tu crées des articles optimisés pour le référencement local.",
        aeoIntro: "Tu es un expert en AEO (Answer Engine Optimization) pour ChatGPT, Gemini et Perplexity.",
        generateIn: "Génère le contenu en français.",
        respondIn: "Réponds en français.",
        jsonOnly: "IMPORTANT: Réponds UNIQUEMENT en JSON valide:",
        noComment: "Aucun commentaire",
        universalLabel: "en France",
      },
      en: {
        intro: "You are an expert in SEO and digital marketing.",
        analyzeIntro: "You are a local SEO and digital marketing expert. You analyze business profiles to extract relevant keywords and understand their activity.",
        articleIntro: "You are an SEO and web writing expert. You create articles optimized for local search.",
        aeoIntro: "You are an AEO (Answer Engine Optimization) expert for ChatGPT, Gemini, and Perplexity.",
        generateIn: "Generate content in English.",
        respondIn: "Respond in English.",
        jsonOnly: "IMPORTANT: Respond ONLY with valid JSON:",
        noComment: "No comment",
        universalLabel: "in your area",
      }
    };

    const lang = langConfig[contentLang];

    // Use pre-scraped content from database - NO MORE Firecrawl calls here
    const scrapedContent = websiteContent || null;
    
    if (scrapedContent) {
      console.log(`[generate-seo-content] Using pre-scraped website content: ${scrapedContent.length} chars`);
    } else {
      console.log(`[generate-seo-content] No website content available`);
    }

    // Combine all business context
    const fullContext = [
      businessDescription,
      gmbDescription,
      scrapedContent ? `\n--- WEBSITE CONTENT ---\n${scrapedContent}` : "",
    ].filter(Boolean).join("\n");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "analyze_business") {
      // Analyze business and generate keywords
      systemPrompt = `${lang.analyzeIntro}
${scrapedContent ? "IMPORTANT: Use the scraped website content to generate PRECISE and RELEVANT keywords based on the actual services/products offered." : ""}
${lang.generateIn}`;

      userPrompt = `Analyze this business and generate relevant SEO keywords:
Name: ${businessName}
Description: ${businessDescription || "Not provided"}
Location: ${location}
${websiteUrl || sourceUrl ? `Website: ${websiteUrl || sourceUrl}` : ""}
${scrapedContent ? `\n--- WEBSITE CONTENT (IMPORTANT - use this info) ---\n${scrapedContent}\n--- END CONTENT ---` : ""}

${lang.jsonOnly}
{
  "description": "Optimized business description in 2-3 sentences based on actual site content",
  "keywords": ["keyword 1", "keyword 2", ...],
  "categories": ["category 1", "category 2"]
}

Generate 30 varied keywords including:
- Main keywords for the industry ${scrapedContent ? "(based on scraped content)" : ""}
- Local keywords (with the city)
- Frequent customer questions
- Specific services/products ${scrapedContent ? "MENTIONED ON THE SITE" : "mentioned"}
- Long-tail variants`;

    } else if (type === "article_titles") {
      // Generate 30 article titles
      const numTitles = count || 30;
      const city = extractCityFromAddress(location);
      
      // Determine region from city
      const getRegion = (cityName: string): string => {
        const regions: Record<string, string> = {
          "paris": "Île-de-France", "montreuil": "Île-de-France", "lognes": "Île-de-France",
          "lyon": "Rhône-Alpes", "marseille": "PACA", "toulouse": "Occitanie",
          "nantes": "Pays de la Loire", "bordeaux": "Nouvelle-Aquitaine",
          "lille": "Hauts-de-France", "strasbourg": "Grand Est", "nice": "PACA",
          "london": "Greater London", "manchester": "Greater Manchester", "birmingham": "West Midlands",
          "new york": "New York", "los angeles": "California", "chicago": "Illinois"
        };
        const cityLower = cityName.toLowerCase();
        for (const [key, region] of Object.entries(regions)) {
          if (cityLower.includes(key)) return region;
        }
        return lang.universalLabel;
      };
      
      const region = getRegion(city);
      
      if (contentLang === "en") {
        systemPrompt = `You are an SEO and content marketing expert. You create UNIQUE and ORIGINAL article titles.

STRICT RULES:
- FORBIDDEN: "Where to find...", "Discover...", "The best..." at the beginning of titles
- Each title must have a UNIQUE ANGLE (number, comparison, guide, mistake to avoid, trend)
- Length: 50-70 characters
- Vary formats: questions, lists, guides, case studies

LOCALIZATION RULES (VERY IMPORTANT):
- 30% of titles: with the city "${city}"
- 30% of titles: with the region "${region}" or "${lang.universalLabel}"
- 40% of titles: WITHOUT location (universal topics)
- NEVER include zip codes in titles`;

        userPrompt = `Generate ${numTitles} UNIQUE and VARIED SEO article titles for:
Business: ${businessName}
Industry: ${fullContext || "Not specified"}
City for local titles: ${city}
Region: ${region}
${keywords?.length ? `Keywords: ${keywords.join(", ")}` : ""}

REQUIRED DISTRIBUTION for ${numTitles} titles:
- ~${Math.round(numTitles * 0.3)} titles with "${city}" (e.g., "Complete guide to sofas in ${city}")
- ~${Math.round(numTitles * 0.3)} titles with "${region}" or "${lang.universalLabel}" (e.g., "2025 decor trends ${region}")
- ~${Math.round(numTitles * 0.4)} titles WITHOUT location (e.g., "7 mistakes to avoid when buying a sofa")

TEMPLATES TO VARY:
1. NUMBERS: "7 mistakes to avoid...", "The 5 criteria for..."
2. QUESTIONS: "How much does...?", "What is the best time to...?"
3. COMPARISONS: "X vs Y: which to choose?", "Differences between..."
4. GUIDES: "Complete guide:", "Step by step:"
5. TRENDS: "2025 trends:", "What's changing in..."
6. PROBLEMS: "How to solve...", "What to do if..."

ABSOLUTE PROHIBITIONS:
- No "Where to find" or "Discover" at the beginning
- No generic titles like "The advantages of..."
- No structure repetitions
- NOT "${city}" in all titles!

${lang.jsonOnly}
{
  "titles": ["Title 1", "Title 2", "Title 3", ...]
}`;
      } else {
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

${lang.jsonOnly}
{
  "titles": ["Titre 1", "Titre 2", "Titre 3", ...]
}`;
      }

    } else if (type === "seo_article") {
      if (contentLang === "en") {
        systemPrompt = `${lang.articleIntro}
      
Important rules:
- Write in English with a professional but accessible tone
- Use keywords naturally (2-3% density)
- Structure with H2 and H3
- Include bullet lists when relevant
- Length: 800-1200 words
- Optimize for local search
- Add a call to action at the end`;

        userPrompt = `Create an SEO article for:
Business: ${businessName}
Description: ${fullContext}
Location: ${location}
${title ? `Article title: ${title}` : ""}
${sourceUrl ? `Source URL: ${sourceUrl}` : ""}
${keywords?.length ? `Keywords: ${keywords.join(", ")}` : ""}

Generate a complete article with:
1. ${title ? `Keep the title: "${title}"` : "Catchy title (H1)"}
2. Meta description (max 155 characters)
3. Content structured in markdown
4. Conclusion with CTA

${lang.jsonOnly}
{
  "article": {
    "title": "${title || "Article title"}",
    "meta_description": "Meta description of max 155 characters",
    "content": "Complete content in markdown with H2, H3, lists..."
  }
}`;
      } else {
        systemPrompt = `${lang.articleIntro}
      
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

${lang.jsonOnly}
{
  "article": {
    "title": "${title || "Titre de l'article"}",
    "meta_description": "Description meta de 155 caractères max",
    "content": "Contenu complet en markdown avec H2, H3, listes..."
  }
}`;
      }

    } else if (type === "aeo_questions") {
      const city = extractCityFromAddress(location);
      const existingQuestions = keywords?.slice(1) || []; // Existing questions passed after the first keyword
      const numQuestions = singleQuestion ? 1 : 5;
      const excludeList = existingQuestions.length > 0 
        ? (contentLang === "en" 
            ? `\n\nQUESTIONS NOT TO REPEAT:\n${existingQuestions.map((q: string) => `- ${q}`).join("\n")}`
            : `\n\nQUESTIONS À NE PAS RÉPÉTER:\n${existingQuestions.map((q: string) => `- ${q}`).join("\n")}`)
        : "";
      
      if (contentLang === "en") {
        systemPrompt = `${lang.aeoIntro}

OBJECTIVE: Create Q&A that AI will CITE in their responses.
${scrapedContent ? "\n⚠️ IMPORTANT: You have access to the ACTUAL website content. Use this information to create PRECISE and RELEVANT Q&A based on real services, products and prices mentioned." : ""}

OPTIMAL RESPONSE FORMAT (60-80 words MAX):
- Sentence 1: Precise fact/figure (average price, timeframe, percentage) ${scrapedContent ? "EXTRACTED FROM SITE IF AVAILABLE" : ""}
- Sentence 2: Selection criterion or key context
- Sentence 3: Example with ${businessName}

ANTI-GENERIC RULES:
- NEVER start with "At ${businessName}..." or "In ${city}..."
- ALWAYS include a verifiable number or data ${scrapedContent ? "(preferably from the site)" : ""}
- DIRECT answer, no promotional wording
- Natural questions like a conversation with an AI`;

        userPrompt = `Generate ${numQuestions} AEO question-answer pair(s) for:
Business: ${businessName}
Activity: ${businessDescription || "Not specified"}
City: ${city || location}
${keywords?.length ? `Keyword: ${keywords[0]}` : ""}
${scrapedContent ? `\n--- WEBSITE CONTENT (USE THIS REAL INFO) ---\n${scrapedContent}\n--- END CONTENT ---` : ""}
${excludeList}

CATEGORIES TO VARY:
- price: "How much does...", "What budget for..."
- timeframe: "How long...", "What timeframe for..."
- choice: "How to choose...", "What criteria for..."
- quality: "How to recognize...", "What signs of..."
- local: "Where to find in ${city}...", "Is there... near..."

EXAMPLES OF GOOD RESPONSES:
❌ "At ${businessName}, you will find a wide range of quality products..."
✅ "The average price of a 3-seater sofa ranges from $800 to $2500 depending on materials. Prefer stain-resistant fabrics for families. ${businessName} in ${city} offers models from $650 with 5-year warranty."

${lang.jsonOnly}
{
  "questions": [
    {
      "question": "Natural ChatGPT-style question",
      "answer": "60-80 word response with figure + context + ${businessName} example",
      "category": "price|timeframe|choice|quality|local"
    }
  ]
}`;
      } else {
        systemPrompt = `${lang.aeoIntro}

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

${lang.jsonOnly}
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
    }

    console.log(`[generate-seo-content] Type: ${type}, Business: ${businessName}`);

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "BILLING_ERROR",
            message: "Crédits IA épuisés. Veuillez recharger votre solde Lovable AI.",
            fallback: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "RATE_LIMITED",
            message: "Trop de requêtes. Réessayez dans quelques instants.",
            fallback: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          error: "SERVICE_UNAVAILABLE",
          message: `Service IA indisponible (${response.status})`,
          fallback: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      JSON.stringify({
        error: "SERVICE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
