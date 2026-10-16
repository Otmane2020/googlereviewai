# ReviewsAI — correctif paiement Stripe (Lovable Cloud)

## Cible (ne pas se tromper de base)
Projet Lovable : `d71841d0-79b3-46a5-a592-aa582a40bd48`
Dépôt GitHub : `Otmane2020/googlereviewai` branche `main`
Supabase **lié à ce projet** : `hlruprayqfnatnldrski` (voir `supabase/config.toml`).
**Ne pas déployer** ces fonctions dans un autre Supabase.

## Ordre obligatoire
1. Synchroniser la branche `main` dans Lovable.
2. Vérifier dans les secrets serveur (jamais dans `VITE_*`, frontend, logs ou chat) :
   - `STRIPE_SECRET_KEY` : clé Stripe live correspondant aux Stripe Price IDs actuels. Ne pas recréer les produits.
   - `STRIPE_WEBHOOK_SECRET` : secret `whsec_...` de l'endpoint Stripe créé sur ce **même** compte et pour la **même URL**.
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` : secrets standards du Supabase lié.
3. Appliquer **une fois** la migration `supabase/migrations/20261016114500_stripe_credit_pack_purchases.sql` sur `hlruprayqfnatnldrski`. Elle crée un ledger unique par session Stripe et une fonction SQL pour créditer exactement une fois.
4. Déployer / redéployer ces 3 Edge Functions avec toutes leurs dépendances :
   - `create-checkout` avec **verify_jwt=true** — paiement des abonnements et packs de crédits.
   - `stripe-webhook` avec **verify_jwt=false** — vérifie obligatoirement le header `Stripe-Signature`, traite les paiements et attribue les crédits.
   - `create-portal-session` avec **verify_jwt=true** — modification de l'abonnement existant.
   Autres Edge Functions modifiées dans les travaux précédents : `auto-respond-reviews`, `generate-ai-response`, `generate-old-reviews-batch`, `generate-seo-content`, `cron-generate-daily-seo`, `cron-generate-daily-qa`, `publish-gmb-qa`, `publish-gmb-post`, `generate-gmb-image`. Déployer celles-ci également si non à jour, avec leurs imports `_shared`, et leurs vérifications JWT définies dans `supabase/config.toml`. Ne pas changer leurs secrets.
5. **Sur le tableau de bord Stripe du bon compte**, créer/activer un endpoint webhook live si absent :
   - URL : `https://hlruprayqfnatnldrski.supabase.co/functions/v1/stripe-webhook`
   - Events : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded` et `payment_intent.succeeded` (ce dernier est utilisé par les commandes de la boutique, si cette fonction est déployée).
   - Copier le secret `whsec_...` dans `STRIPE_WEBHOOK_SECRET` (l'endpoint URL seul ne suffit pas).
   - Vérifier sur Stripe que l'endpoint est activé et que les livraisons webhook sont en 2xx.
6. Tester **sans encaisser d'argent** : être connecté dans ReviewsAI, sélectionner un pack (ex. 100 crédits) puis s'assurer qu'une URL de Checkout Stripe s'ouvre. Annuler sans payer. Faire de même pour Starter. Les crédits ne doivent être ajoutés **qu'après un paiement réellement confirmé** par un webhook vérifié.
7. Pour vérifier le crédit d'un véritable achat payé, contrôler la table `stripe_credit_purchases`, une ligne `credits_history` type `purchase` et le solde `profiles.credits`. Aucun doublon sur webhook répété.

## Diagnostics
La fenêtre `UpgradeDialog` affiche désormais le code d'erreur retourné par `create-checkout` (ex. `STRIPE_NOT_CONFIGURED`, `STRIPE_AUTH_FAILED`, `STRIPE_PRICE_MISMATCH`).
Le frontend ne doit jamais afficher la clé secrète. Ne pas affirmer « fonctionnel en production » avant un test réussi et la confirmation du webhook.
