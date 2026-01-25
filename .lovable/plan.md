
Objectif (immédiat)
- Faire afficher 65 (comme sur Google) au lieu de 66 dans l’app, sans supprimer aveuglément des avis.
- Corriger/fiabiliser les notifications push (et fournir un test “visible” simple).

Constat (depuis le code + données backend)
- Pour benyahya.otmane@gmail.com (user_id e26f003b-1610-4eb3-ac80-e61e2513caee), la base contient 66 avis synchronisés pour le lieu 15834486420159917356.
- Le Dashboard calcule “Total avis” via `allReviews.length` (donc 66).
- Les fonctions de sync suppriment un avis uniquement s’il est absent de la réponse “list reviews”. Or Google peut afficher 65 publiquement tout en renvoyant 66 au propriétaire via l’API (avis filtré/spam/modération). Dans ce cas, le cron ne “détecte” rien, car l’avis n’est pas réellement absent côté API.
- Bonne nouvelle : l’API `reviews.list` expose un champ `totalReviewCount` (compte “Google”) dans la réponse. On ne l’utilise pas aujourd’hui.

Partie A — Corriger le “Total avis” (65 vs 66) de façon robuste
Approche choisie
- Afficher le “Total avis (Google)” depuis `totalReviewCount` renvoyé par Google, au lieu de compter les lignes locales.
- Garder la synchro détaillée (66 lignes) pour le traitement interne (réponses, historique, etc.) mais ne pas l’utiliser pour le chiffre public.

Changements à implémenter
1) Mettre à jour la sync pour stocker le compteur Google dans la table `businesses`
- La table `businesses` a déjà les colonnes `total_reviews` et `rating` (actuellement total_reviews=0 pour Sweet Deco).
- Modifier les fonctions backend de sync des avis pour récupérer et persister :
  - `totalReviewCount` → `businesses.total_reviews`
  - `averageRating` → `businesses.rating`
- À faire dans :
  - `supabase/functions/sync-google-reviews/index.ts`
  - `supabase/functions/cron-sync-reviews/index.ts`
- Détail technique :
  - Lors du fetch `reviews.list`, lire `totalReviewCount`/`averageRating` de la réponse (sur la première page ou chaque page, peu importe ; on mettra à jour à la fin de la sync d’un lieu).
  - Relier le lieu Google (locationId) à `businesses.google_place_id` (c’est déjà le mapping utilisé ailleurs).
  - Faire un `update businesses set total_reviews=?, rating=?, updated_at=now()` pour le business correspondant (si présent et actif).

2) Mettre à jour l’UI pour afficher le bon chiffre
- Dashboard (`src/pages/Dashboard.tsx`)
  - Remplacer `stats.total = allReviews.length` par une valeur basée sur `businesses.total_reviews` (somme des businesses actives).
  - Conserver éventuellement un “Avis synchronisés” (optionnel) = `allReviews.length` pour transparence (mais le “Total avis” doit suivre Google).
- Reviews (`src/pages/Reviews.tsx`)
  - Le “total” par établissement doit être `selectedBusiness.total_reviews` (si présent), sinon fallback sur `businessReviews.length`.
- Résultat attendu : Sweet Deco affiche 65 avis (comme la capture), même si 66 lignes restent en base.

3) (Optionnel mais recommandé) Clarifier l’origine du chiffre
- Ajouter un label/tooltip “Total avis (Google)” pour éviter la confusion “synchro vs affichage public”.

Partie B — “En attente” incohérent (6 vs 5) + cohérence des stats
Constat actuel pour ce user :
- En base : pending=5 (non publié + pas de google_reply), total=66.
- Si Google “public” est 65, il est probable que l’avis “fantôme” influence aussi le compteur “en attente” côté app.

Changements à implémenter (cohérents avec la Partie A)
1) Décorréler “Total avis (Google)” de “Avis en attente”
- “Total avis (Google)” vient de `businesses.total_reviews`.
- “Avis en attente” doit représenter les avis réellement traitables : on garde la logique sur les lignes locales (non répondu sur Google), MAIS on affiche aussi une explication si `businessReviews.length !== total_reviews` (ex: “1 avis est visible côté API mais pas affiché publiquement par Google”).
2) Si vous exigez “pending” calé sur Google :
- (Étape ultérieure si nécessaire) Ajouter une option manuelle “Masquer cet avis des stats” (archivage) pour exclure 1 avis précis des compteurs. Cela nécessite un petit champ en base (ex: `reviews.archived_at`) + bouton UI.
- Vu l’urgence, je propose d’abord la solution “Total avis via Google” (Partie A) qui règle le 65 immédiatement, puis on ajuste “pending” si vous confirmez quel avis est le “fantôme”.

Partie C — Notifications push “ne fonctionne pas”
Constats techniques dans le code
- Le service worker (`public/firebase-messaging-sw.js`) affiche bien les notifications en arrière-plan.
- Il manque un handler “foreground” (`onMessage`) : quand l’app est ouverte, un push peut ne rien afficher visuellement.
- Le backend `send-push-notification` est potentiellement appelable sans contrôle strict d’identité (risque). Il faut sécuriser.

Changements à implémenter
1) Ajouter la réception “foreground” (app ouverte)
- Ajouter un petit module/hook (ou compléter `useFirebasePush`) qui enregistre `onMessage(messaging, ...)` pour :
  - afficher un toast in-app (sonner) dès qu’un push arrive
  - (optionnel) déclencher une Notification native si souhaité et permission ok
2) Ajouter un bouton “Tester les notifications” dans l’écran Notifications (ou Settings)
- Action : appeler un backend function “test-push” (nouvelle fonction dédiée) qui envoie une notification à l’utilisateur courant.
- Résultat : vous pouvez confirmer sur téléphone/desktop en 1 clic.
3) Sécuriser l’envoi push
- Modifier `send-push-notification` (ou n’exposer que “test-push”) pour exiger un appel authentifié et vérifier :
  - user connecté
  - `user.id === user_id` (sauf appels service role internes)
- Objectif : éviter qu’un client puisse envoyer des push à n’importe quel user_id.

Vérifications après implémentation
1) Lancer une sync avis (manuelle) puis vérifier :
- `businesses.total_reviews` passe à 65 pour Sweet Deco
- Dashboard affiche 65 en “Total avis”
- Reviews affiche 65 pour l’établissement
2) Tester push :
- Cliquer “Tester les notifications” → notification visible (app fermée ou PWA) + toast si app ouverte
3) Vérifier que les jobs planifiés existent et tournent :
- `auto-respond-reviews` est bien planifié toutes les 5 minutes (déjà présent)
- `cron-sync-reviews` tourne (déjà présent)

Livrables (fichiers impactés)
- Backend functions :
  - supabase/functions/sync-google-reviews/index.ts (persist totalReviewCount/averageRating)
  - supabase/functions/cron-sync-reviews/index.ts (persist totalReviewCount/averageRating)
  - supabase/functions/send-push-notification/index.ts (sécurisation) OU nouvelle fonction test dédiée
- Frontend :
  - src/pages/Dashboard.tsx (Total avis basé sur businesses.total_reviews)
  - src/pages/Reviews.tsx (Total avis basé sur selectedBusiness.total_reviews)
  - src/hooks/useFirebasePush.ts (ajout onMessage + état)
  - src/pages/Notifications.tsx ou src/pages/Settings.tsx (bouton “Tester notifications”)

Décision rapide (pour éviter de rallonger)
- Je vais implémenter en priorité la voie “Total avis = totalReviewCount Google” (Partie A) + test push + handler foreground (Partie C).
- Si après ça vous voulez aussi que “en attente” soit exactement celui que vous voyez sur Google, on ajoutera l’option d’archivage manuel (petite étape supplémentaire).
