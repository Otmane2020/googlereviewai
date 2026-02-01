
# Plan : Correction de la régénération AEO (0 articles générés)

## Diagnostic

Le problème vient d'un **flux découplé** entre le scraping Firecrawl et la génération de contenu :

| Composant | Rôle actuel | Problème |
|-----------|-------------|----------|
| `generate-seo-content` | Génère Q&A à partir de `websiteContent` | Ne scrappe plus (dépend du contenu pré-scrapé) |
| `analyze-business-website` | Scrappe avec Firecrawl + génère keywords | **Jamais appelé** lors de "Analyser & Générer" |
| `businesses.website_content` | Stocke le contenu scrapé | **NULL** pour tous les établissements |

## Solution

### Etape 1 : Modifier `analyzeAndGeneratePlan` dans `AEORank.tsx`

Avant de générer le plan 30 jours, on appelle **d'abord** `analyze-business-website` pour :
1. Scraper le site avec Firecrawl (nouvelle clé `FIRECRAWL_API_KEY_1`)
2. Stocker le `website_content` en base
3. Générer les keywords automatiquement

```text
FLUX ACTUEL (cassé):
analyzeAndGeneratePlan → generate-seo-content (type: analyze_business) → 0 content

FLUX CORRIGÉ:
analyzeAndGeneratePlan 
  → analyze-business-website (Firecrawl scrape + save website_content)
  → Utiliser keywords retournés
  → Créer planning 30 jours
  → Générer Q&A en batch avec websiteContent stocké
```

### Etape 2 : Supprimer les anciens Q&A non publiés

Puisque tu veux "tout remplacer", on supprime d'abord les `scheduled_content` avec `status != 'published'` pour ce business avant de recréer.

### Etape 3 : Rafraîchir `selectedBusiness.website_content` après le scrape

Après l'appel à `analyze-business-website`, on recharge le business depuis la DB pour avoir le `website_content` frais, puis on l'utilise pour générer les Q&A.

---

## Modifications techniques

### Fichier : `src/pages/AEORank.tsx`

**Fonction `analyzeAndGeneratePlan` (lignes 215-363)**

```typescript
const analyzeAndGeneratePlan = async () => {
  if (!selectedBusiness) return;
  
  setGenerating(true);
  try {
    // ÉTAPE 1: Supprimer les anciens Q&A non publiés (tout remplacer)
    await supabase
      .from("scheduled_content")
      .delete()
      .eq("business_id", selectedBusiness.id)
      .eq("user_id", user!.id)
      .eq("content_type", "aeo_qa")
      .neq("status", "published");

    // ÉTAPE 2: Appeler analyze-business-website pour scraper avec Firecrawl
    // et générer les keywords
    const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
      "analyze-business-website",
      {
        body: {
          businessId: selectedBusiness.id,
          website: selectedBusiness.website,
          generateContent: false, // On génère les Q&A séparément
        },
      }
    );

    if (analysisError) throw analysisError;

    // ÉTAPE 3: Recharger le business pour avoir website_content frais
    const { data: freshBusiness } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", selectedBusiness.id)
      .single();

    const keywords = analysisData?.keywords || freshBusiness?.auto_keywords || [];
    const websiteContent = freshBusiness?.website_content || null;

    // Mettre à jour l'état local
    setSelectedBusiness({
      ...selectedBusiness,
      auto_keywords: keywords,
      website_content: websiteContent,
      description: analysisData?.description || selectedBusiness.description,
    });

    // ÉTAPE 4: Créer planning 30 jours
    const today = startOfToday();
    const planItems = [];

    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const keyword = keywords[i % keywords.length] || selectedBusiness.name;

      planItems.push({
        user_id: user!.id,
        business_id: selectedBusiness.id,
        content_type: "aeo_qa",
        scheduled_date: dateStr,
        status: "pending",
        keyword_used: keyword,
      });
    }

    // Insérer le planning
    await supabase
      .from("scheduled_content")
      .upsert(planItems, { 
        onConflict: "user_id,business_id,content_type,scheduled_date" 
      });

    // ÉTAPE 5: Générer tous les Q&A en batch avec websiteContent
    const { data: newItems } = await supabase
      .from("scheduled_content")
      .select("*")
      .eq("business_id", selectedBusiness.id)
      .eq("user_id", user!.id)
      .eq("content_type", "aeo_qa")
      .eq("status", "pending")
      .order("scheduled_date", { ascending: true });

    const pendingItems = newItems || [];
    const batchSize = 5;
    let generatedCount = 0;

    for (let i = 0; i < pendingItems.length; i += batchSize) {
      const batch = pendingItems.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (item) => {
        try {
          await supabase
            .from("scheduled_content")
            .update({ status: "generating" })
            .eq("id", item.id);

          const { data, error } = await supabase.functions.invoke("generate-seo-content", {
            body: {
              type: "aeo_questions",
              businessName: selectedBusiness.name,
              businessDescription: freshBusiness?.description || selectedBusiness.description,
              location: selectedBusiness.address || "France",
              websiteContent: websiteContent, // Utiliser le contenu fraîchement scrapé
              keywords: [item.keyword_used],
              singleQuestion: true,
            },
          });

          if (error) throw error;

          const qa = data?.questions?.[0];
          
          await supabase
            .from("scheduled_content")
            .update({ 
              status: qa?.question ? "generated" : "failed",
              question: qa?.question || null,
              answer: qa?.answer || null,
              title: qa?.question || null,
            })
            .eq("id", item.id);

          if (qa?.question) generatedCount++;
        } catch (err) {
          console.error(`Error generating Q&A for ${item.id}:`, err);
          await supabase
            .from("scheduled_content")
            .update({ status: "failed", error_message: err.message })
            .eq("id", item.id);
        }
      }));

      // Mettre à jour l'UI après chaque batch
      await fetchScheduledContent(selectedBusiness.id);
    }

    toast({ 
      title: "Terminé !", 
      description: `${generatedCount} Q&A générés avec ${keywords.length} mots-clés`
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    toast({ 
      title: "Erreur", 
      description: error.message || "Impossible de générer le plan", 
      variant: "destructive" 
    });
  }
  setGenerating(false);
};
```

---

## Résumé des changements

| Fichier | Modification |
|---------|--------------|
| `src/pages/AEORank.tsx` | Refactoriser `analyzeAndGeneratePlan` pour : 1) supprimer anciens Q&A, 2) appeler `analyze-business-website` d'abord, 3) recharger le business, 4) générer avec `websiteContent` frais |

## Résultat attendu

- Le clic sur "Analyser & Générer" :
  1. Supprime les anciens Q&A non publiés
  2. Scrappe le site avec Firecrawl (nouvelle clé API)
  3. Génère 30 Q&A avec le contenu réel du site
  4. Affiche le toast avec le nombre de Q&A générés > 0
