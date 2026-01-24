
# Plan d'amélioration de Maps Rank

## Problèmes identifiés

1. **Visualisation confuse** : Difficile de voir son propre positionnement parmi les points
2. **Labels incorrects** : Les labels "A1, B2, etc." ne sont pas intuitifs et manquent de contexte
3. **Aucune gestion de mots-clés** : Pas de système pour sauvegarder/réutiliser les mots-clés testés
4. **Pas de lien avec AEO/SEO** : Les résultats Maps Rank ne guident pas la création de contenu

---

## Solution proposée

### 1. Améliorer la visualisation du positionnement

**Problème** : On ne voit pas clairement où on est classé.

**Solution** :
- Ajouter un **score de visibilité global** en gros (ex: "72% visible en Top 10")
- Afficher clairement **"VOUS"** sur le marker central avec votre nom d'établissement
- Ajouter une **heatmap visuelle** montrant les zones fortes/faibles
- Améliorer les popups avec **votre position mise en évidence** dans la liste des concurrents

### 2. Corriger les labels et ajouter du contexte

**Problème** : "Point A1" ne veut rien dire.

**Solution** :
- Remplacer les labels par des **directions géographiques** (Nord, Sud-Est, Centre, etc.)
- Afficher la **distance approximative** du centre ("À 2km au Nord")
- Ajouter une **info-bulle au survol** avant le clic

### 3. Système de gestion des mots-clés

**Problème** : Aucun historique des mots-clés, on doit tout retaper.

**Solution** :
- Créer une **table `maps_rank_keywords`** pour stocker les mots-clés par établissement
- Afficher les **mots-clés récents** en chips cliquables
- **Suggérer des mots-clés** basés sur les catégories de l'établissement
- Permettre de **comparer l'évolution** d'un mot-clé dans le temps

### 4. Liaison avec AEO et SEO

**Problème** : Les données Maps Rank ne sont pas utilisées pour améliorer le contenu.

**Solution** :
- Bouton **"Améliorer ce mot-clé"** qui envoie vers AEO/SEO avec le mot-clé pré-rempli
- Section **"Recommandations"** basée sur les résultats :
  - Si mal classé → "Générer du contenu Q&A pour ce mot-clé"
  - Analyse des **concurrents forts** → "Ils sont mieux classés sur ces termes"
- Stocker le **dernier rang moyen par mot-clé** dans `businesses` pour suivi

---

## Changements techniques

### Base de données

```text
Nouvelle table : maps_rank_keywords
┌─────────────────┬───────────────┬─────────────────────────────────┐
│ Colonne         │ Type          │ Description                     │
├─────────────────┼───────────────┼─────────────────────────────────┤
│ id              │ uuid          │ Identifiant unique              │
│ user_id         │ uuid          │ Propriétaire                    │
│ business_id     │ uuid          │ Établissement lié               │
│ keyword         │ text          │ Mot-clé                         │
│ last_avg_rank   │ numeric       │ Dernier rang moyen obtenu       │
│ scan_count      │ integer       │ Nombre de scans effectués       │
│ last_scanned_at │ timestamp     │ Date du dernier scan            │
│ created_at      │ timestamp     │ Date de création                │
└─────────────────┴───────────────┴─────────────────────────────────┘
```

### Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `src/pages/MapsRank.tsx` | Refonte UI complète avec score de visibilité, suggestions de mots-clés, boutons de liaison AEO/SEO |
| `src/components/RankingMap.tsx` | Labels directionnels, meilleure mise en évidence du positionnement, heatmap optionnelle |
| `supabase/functions/check-maps-ranking/index.ts` | Sauvegarde des mots-clés utilisés et mise à jour du rang moyen |

### Nouveaux composants

| Composant | Rôle |
|-----------|------|
| `KeywordChips.tsx` | Affiche les mots-clés récents en chips cliquables |
| `RankRecommendations.tsx` | Suggestions d'amélioration basées sur les résultats |
| `VisibilityScore.tsx` | Score de visibilité global avec jauge visuelle |

---

## Interface améliorée (aperçu)

```text
┌────────────────────────────────────────────────────────────────┐
│  Maps Rank - Restaurant La Bella Italia                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  Score de visibilité : ████████░░ 72%     │
│  │ Mots-clés       │                                           │
│  │ [restaurant italien] [pizza] [+ Ajouter]                    │
│  │                 │                                           │
│  │ Suggestions:    │  ┌──────────────────────────────────────┐ │
│  │ • trattoria     │  │            CARTE                     │ │
│  │ • pasta         │  │      ●2   ●3   ●5                    │ │
│  └─────────────────┘  │         ★ VOUS                       │ │
│                       │      ●1   ●-   ●4                    │ │
│  ┌─────────────────┐  └──────────────────────────────────────┘ │
│  │ Recommandations │                                           │
│  │ ⚠ Faible sur    │  Légende:                                │
│  │   "pizza" à     │  ● Vert = Top 3  ● Jaune = 4-7           │
│  │   l'Est         │  ● Orange = 8-10 ● Rouge = 11+           │
│  │ [Créer Q&A AEO] │                                           │
│  └─────────────────┘                                           │
└────────────────────────────────────────────────────────────────┘
```

---

## Bénéfices attendus

- **Clarté** : Score global + direction = compréhension immédiate
- **Productivité** : Mots-clés sauvegardés = plus de frappe répétée
- **Stratégie** : Lien direct vers AEO/SEO = amélioration ciblée
- **Suivi** : Historique des rangs = mesure de progression
