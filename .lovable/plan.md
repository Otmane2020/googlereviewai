# Refonte Ranki.ai — Plan d'exécution

Le périmètre est large et touche paiement, IA auto, emails et notifs. Je propose de tout livrer en un lot cohérent, mais structuré en 6 chantiers.

## 1. Nouvelle grille tarifaire (suppression du gratuit)

Nouveaux plans alignés partout (landing, onboarding, upgrade, dashboard) :

| Plan | Mensuel | Annuel (-20%) | Inclus |
|---|---|---|---|
| Starter | 9,99 € | 95,90 €/an (≈7,99/mois) | Réponses IA aux avis Google uniquement |
| Pro | 49 € | 470 €/an (≈39/mois) | Avis + GEO Rank + SEO/AEO auto |
| Business | 99 € | 950 €/an (≈79/mois) | Pro + multi-établissements + posts illimités |

Actions :
- Créer 6 prix Stripe (3 plans × mensuel/annuel) via `stripe--create_stripe_product_and_price`
- Mapper `priceKey` → `price_id` dans `create-checkout/index.ts`
- Mettre à jour `RankiPricingSection.tsx` avec **toggle Mensuel / Annuel -20%**
- Mettre à jour `Onboarding.tsx` (mêmes plans, suppression « Starter gratuit »)
- Mettre à jour `UpgradeDialog.tsx` (mêmes plans + toggle annuel)
- Dans `Dashboard` / `Settings`, le bloc « Plan actuel » lit `profiles.plan_name` et affiche le bon libellé + prix
- Migration : étendre la contrainte `plan_name` aux nouvelles valeurs (`starter`, `pro`, `business`, suffixe `_yearly`)

## 2. Pilotage des fonctionnalités par plan

- `hasGeo = plan in {pro, business}`, `hasSeo = plan in {pro, business}`
- `MapsRank` et `SEOAutoPost` : suppression des boutons manuels « Analyser » / « Générer » quand le plan permet l'auto. Le cron existant (`cron-generate-daily-seo`, `check-maps-ranking`) prend le relais.
- Si plan inférieur : on garde un CTA upgrade.
- Bloc upsell **« Module AEO Premium inclus dans Quotidien / Agence »** dans `AEORank.tsx` : masqué si `plan_name in {pro, business}`.

## 3. Emails dans la langue du navigateur

- À l'inscription, `handle_new_user` stocke déjà `preferred_language` depuis metadata. Ajout côté client : avant `signInWithOAuth`, on passe `data: { preferred_language: i18n.language }` dans `queryParams` impossible → fallback : après login, on UPDATE `profiles.preferred_language` avec `navigator.language` si vide.
- `send-welcome-email` : déjà compatible `lang`, mais le trigger `send_welcome_email_on_signup` lit `NEW.preferred_language` qui est NULL au moment du trigger (avant l'update côté client). Solution : lire depuis `raw_user_meta_data->>'preferred_language'` ou auto-détecter via header `Accept-Language` passé dans le body.
- Tous les autres mails passent par `resolveEmailLang()` qui lit `profiles.preferred_language` → ça marchera dès que le profil est correctement initialisé.
- Action client : dans `AuthContext`, au premier login, si `profile.preferred_language` est vide, on UPDATE avec `navigator.language.startsWith('en') ? 'en' : 'fr'`.

## 4. Auto-détection langue UI

- `src/i18n/config.ts` : la détection `navigator.language` est déjà là, mais on respecte `localStorage`. Ajout : si le user a un `profiles.preferred_language` ≠ langue UI, on resynchronise au login.

## 5. Vraie popup d'installation PWA mobile

- `InstallPrompt.tsx` : actuellement affiche un guide texte sur iOS. Refonte :
  - Android / Chrome : capter `beforeinstallprompt`, stocker l'event, afficher modal avec **bouton « Installer »** qui appelle `event.prompt()`.
  - iOS Safari (pas d'API d'install) : on garde un mini-guide mais sous forme de **modal compact** avec une étape unique « Appuyez sur Partager → Sur l'écran d'accueil », pas un long tuto.

## 6. Push notifications qui ne partent pas

- Diagnostic : `notify-new-review` est appelé par le trigger `notify_on_new_review`, mais il n'invoque pas explicitement `send-push-notification`. À vérifier dans le fichier.
- Correctifs probables :
  - Dans `notify-new-review`, ajouter l'appel à `send-push-notification` après l'email.
  - Vérifier que `push_subscriptions` contient bien les abonnements (les nouveaux flows iOS PWA).
  - Vérifier les logs récents pour erreurs VAPID.

## Détails techniques

- Stripe : `STRIPE_SECRET_KEY` déjà configuré. Création produits via outil MCP Stripe.
- DB : migration pour assouplir `plan_name` (text libre, donc juste une migration des valeurs existantes : `free`/`daily` → `starter` selon mapping).
- Aucune suppression de plan en DB pour les utilisateurs existants : on map `daily` → `starter` à la lecture.

## Hors scope (à confirmer)

- Je ne touche pas à la boutique NFC ni au flux `/shop/*`.
- Je ne touche pas aux crédits mensuels (25 free) car la dispo du gratuit dans l'app reste pour les comptes legacy.

Confirmes-tu cette grille tarifaire et je lance tout d'un coup ?
