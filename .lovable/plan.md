
# Plan : Correction du bug de fausses suppressions d'avis

## Probleme identifie

Le systeme de synchronisation detecte a tort des avis comme supprimes lorsque la pagination Google echoue partiellement.

**Ce qui s'est passe a 15:56 :**
1. Le CRON a synchronise les avis de Sweet Deco (65 avis en base)
2. Page 1 a retourne 50 avis
3. Page 2 n'a PAS ete chargee (timeout ou erreur reseau silencieuse)
4. Le systeme a compare 50 avis Google vs 65 avis en DB
5. 15 avis "manquants" ont ete detectes comme supprimes
6. Le seuil de securite 20% (65 * 0.2 = 13) a limite les suppressions a 13 avis
7. 13 avis ont ete supprimes a tort et 13 notifications envoyees
8. Au cycle suivant, les 13 avis ont ete recreent depuis Google

## Cause racine

Le code ne verifie pas si la pagination est complete avant de declencher la detection de suppressions. Si `nextPageToken` existe mais que la boucle sort (erreur, timeout), les avis des pages non chargees sont consideres comme supprimes.

## Solution proposee

Ajouter un garde de securite supplementaire dans les deux fonctions de synchronisation :

**Garde 3 - Verification de pagination complete :**
- Si `allGoogleReviewIds.length < googleTotalReviewCount` (le total officiel), skipper la detection de suppression
- Cela signifie que toutes les pages n'ont pas ete chargees

**Amelioration du seuil de securite :**
- Reduire le seuil de 20% a 10% pour limiter les faux positifs
- Ajouter un minimum absolu (ex: max 5 suppressions par cycle)

---

## Fichiers a modifier

### 1. `supabase/functions/cron-sync-reviews/index.ts`

**Lignes ~406-425 :** Ajouter verification pagination complete

```typescript
// GUARD 3: Skip if pagination was incomplete
if (googleTotalReviewCount !== undefined && allGoogleReviewIds.length < googleTotalReviewCount) {
  console.log(`[CRON] [SAFETY] Skipping deletion detection - incomplete pagination: ${allGoogleReviewIds.length}/${googleTotalReviewCount}`);
} else if (hasCriticalErrors) {
  // existing guard 1...
}
```

**Reduire le seuil :**
```typescript
// GUARD 2: Safety threshold - max 10% deletions (reduced from 20%) AND max 5 absolute
const maxDeletionsPercent = Math.ceil(existingReviews.length * 0.10);
const maxDeletions = Math.min(maxDeletionsPercent, 5);
```

### 2. `supabase/functions/sync-google-reviews/index.ts`

**Lignes ~514-550 :** Memes gardes de securite

Ajouter la verification du total Google avant suppression :
```typescript
// Store googleTotalReviewCount per location
// Compare allGoogleReviewIds.length vs sum of all googleTotalReviewCount
// Skip deletion if incomplete
```

---

## Impact

- Elimination des fausses notifications "Avis supprime"
- Les vraies suppressions seront encore detectees, mais seulement quand TOUTES les pages sont chargees
- Reduction du nombre max de suppressions par cycle (5 au lieu de 13)

---

## Details techniques

### Flux de synchronisation actuel

```text
1. Fetch Page 1 (50 avis) 
   -> nextPageToken existe
2. Fetch Page 2 (15 avis)
   -> nextPageToken = null
3. Total: 65 avis
4. Compare avec DB (65 avis)
5. 0 suppression detectee ✓
```

### Flux problematique (15:56)

```text
1. Fetch Page 1 (50 avis)
   -> nextPageToken existe
2. Page 2 echoue (timeout silencieux)
3. Total: 50 avis seulement
4. Compare avec DB (65 avis)
5. 15 avis "manquants"
6. Seuil 20% = 13 suppressions ✗
```

### Nouveau flux avec garde

```text
1. Fetch Page 1 (50 avis)
   -> googleTotalReviewCount = 65
2. Page 2 echoue
3. Total fetched: 50 < 65 officiel
4. [SAFETY] Pagination incomplete
5. Skip deletion detection ✓
```

---

## Nettoyage des notifications erronees

Supprimer les notifications de type `review_deleted` creees le 2026-01-26 a 15:56 pour l'utilisateur `oben.rockman` (optionnel, a faire via requete SQL directe).
