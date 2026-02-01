
# Plan d'amélioration de la qualité du contenu SEO/AEO

## Problèmes identifiés

1. **Modèle IA trop basique** : Le système utilise `gemini-2.5-flash-lite` (le modèle le moins performant) au lieu d'un modèle plus avancé
2. **Prompts trop génériques** : Les instructions ne demandent pas assez de variété ni de spécificité
3. **Pas de déduplication** : Le système génère des questions similaires sans vérifier l'historique
4. **Localisation brute** : L'adresse complète est passée telle quelle au lieu d'extraire la ville/quartier
5. **Réponses AEO trop longues** : 100-150 mots demandés alors que les IA préfèrent 60-80 mots

## Solution proposée

### 1. Upgrade du modèle IA
Passer de `gemini-2.5-flash-lite` à `gemini-2.5-flash` pour une meilleure qualité de génération.

### 2. Amélioration des prompts SEO/AEO

**Nouveau prompt AEO avec règles de qualité :**
- Questions variées par catégorie (éviter les répétitions)
- Réponses plus concises (60-80 mots max)
- Chiffres et données spécifiques obligatoires
- Éviter les formulations génériques ("Chez X, vous trouverez...")

**Nouveau prompt SEO :**
- Titres plus originaux (pas de "Où trouver..." répétitifs)
- Focus sur des angles uniques (comparatifs, guides, témoignages)
- Intégration naturelle de la localisation (quartier, pas code postal)

### 3. Extraction intelligente de la localisation
- Parser l'adresse pour extraire uniquement la ville
- Ajouter les villes proches si disponibles
- Ne pas inclure le code postal dans le contenu

### 4. Système anti-duplication
- Vérifier les questions existantes avant génération
- Passer l'historique des 10 dernières questions au prompt
- Forcer des angles différents à chaque génération

## Modifications techniques

### Edge Function `generate-seo-content/index.ts`

```text
Changements :
├── Ligne 176: model: "gemini-2.5-flash-lite" → "google/gemini-2.5-flash"
├── Lignes 131-164: Refonte du prompt AEO
│   ├── Ajout règles anti-répétition
│   ├── Réduction longueur réponses (60-80 mots)
│   └── Catégories obligatoires variées
├── Lignes 66-94: Refonte du prompt article_titles
│   ├── Templates variés obligatoires
│   └── Interdiction des formules génériques
└── Nouvelle fonction: extractCityFromAddress()
```

### Edge Function `cron-generate-daily-qa/index.ts`

```text
Changements :
├── Récupération des 10 dernières questions générées
├── Passage de l'historique au prompt
└── Instruction explicite d'éviter les doublons
```

## Exemples de qualité attendue

**AVANT (mauvaise qualité) :**
> Question: "Où trouver un grossiste de meubles à Montreuil avec des tarifs avantageux ?"
> Réponse: "Un grossiste de meubles à Montreuil propose des tarifs avantageux sur une large gamme..."

**APRÈS (bonne qualité) :**
> Question: "Quel est le délai de livraison moyen pour un canapé commandé en Île-de-France ?"
> Réponse: "Le délai moyen est de 5 à 15 jours ouvrés pour une livraison sur rendez-vous. Sweet Deco à Lognes propose une livraison gratuite dès 500€ d'achat avec suivi en temps réel."

## Impact attendu

- Contenu 3x plus varié avec moins de répétitions
- Réponses plus factuelles et citables par les IA
- Meilleur positionnement sur les requêtes longue traîne
- Localisation naturelle sans surcharger le texte
