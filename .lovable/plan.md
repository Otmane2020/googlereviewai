
# Plan d'exécution — 11 chantiers regroupés en 4 lots

Trop d'éléments pour un seul tour. Je propose 4 lots livrés successivement. Confirme l'ordre ou ajuste.

---

## Lot 1 — UI & corrections rapides

1. **Remplacer toutes les icônes `Sparkles` (lucide-react) par le favicon `/favicon.svg`**
   - Créer un composant `<RankiIcon className=... />` qui rend `<img src="/favicon.svg" />`
   - Scanner tous les fichiers contenant `Sparkles` (≈30+ fichiers : OnboardingScreen, UpgradeDialog, Header, HeroSection, etc.) et remplacer
2. **Barre top (langue + notifications) figée sur toutes les pages**
   - Ajouter `sticky top-0 z-50` au `Header` + `DashboardHeader`
   - Vérifier qu'aucun parent n'a `overflow-hidden`
3. **SEO non activé après paiement** — corriger `verify-subscription` / `stripe-webhook` pour activer SEO + GEO (pas seulement GEO) quand le plan Daily/Agency est actif

---

## Lot 2 — Paiement, plans, crédits, PWA

4. **Rafraîchissement auto après paiement (actuellement attente 5 min)**
   - Sur `/payment-success` : polling toutes les 2s pendant 20s appelant `verify-subscription`
   - Forcer refresh du `AuthContext` (plan + crédits) après succès
5. **Gestion plan upgrade/downgrade**
   - Ajouter `update-subscription` edge function (Stripe `subscriptions.update` avec `proration_behavior: always_invoice`)
   - Bouton "Changer de plan" dans Settings + `UpgradeDialog` quand déjà abonné
   - Trigger DB : à chaque webhook `customer.subscription.updated`, recalculer `monthly_credits` selon `plans.key`
6. **PWA mobile installable**
   - Vérifier `manifest.webmanifest` (display: standalone, icons 192/512, start_url)
   - Réactiver le prompt `beforeinstallprompt` sur iOS (instructions Safari) et Android (bouton natif)
   - Tester sur `id-preview` désactivé, prod activé

---

## Lot 3 — Cron, multi-établissement, relance avis

7. **Cron publication auto** — audit `cron-publish-scheduled-content` (logs récents, vérifier qu'il tourne, qu'il respecte la limite 1 SEO + 1 GEO/jour)
8. **Changement d'établissement (compte `lovelyanswers.ai@gmail.com`)**
   - Reproduire le bug : sélecteur `BusinessSelector` ne switch pas le contexte
   - Vérifier `save-selected-businesses` + invalidation queries
9. **Relance/vente des avis non répondus par l'IA**
   - Email/notification automatique listant les avis sans réponse IA pour `lovelyanswers.ai@gmail.com`
   - Ajout d'un CTA dans dashboard "X avis attendent une réponse — activez l'auto-réponse"

---

## Lot 4 — Boutique physique NFC (gros chantier)

10. **Produit 1 : Carte NFC Google Avis (19,99€ + 3,99€ livraison)**
    - Page produit `/shop/nfc-card` (photos, description, CTA acheter)
    - Checkout Stripe `mode: payment` avec ligne produit + ligne shipping
    - Table `orders` (user_id, product, qty, shipping_address, shipping_cost, total, status, stripe_session_id, tracking_number)
    - Page `/orders` (utilisateur : suivi commandes)
    - Email confirmation (Resend) en FR/EN
    - Page Admin : liste commandes + édition statut + tracking
11. **Produit 2 : QR code personnalisé imprimé (gratuit)**
    - Wizard `/shop/qr-print` (4 étapes : logo upload, couleur, format, adresse livraison)
    - Génération QR (lib `qrcode` côté client) + preview
    - Table `print_orders` (user_id, design_json, logo_url, shipping_address, status, pdf_url)
    - Admin : génère PDF prêt à imprimer (lib `pdf-lib`) + bouton télécharger

---

## Questions avant de démarrer

- **Ordre** : on commence par le Lot 1 (rapide, visible) ? Puis Lot 2 ?
- **Lot 4** : le produit 2 "gratuit" — y a-t-il une limite (1 par compte ? réservé plan payant ?) pour éviter abus ?
- **Adresse de livraison** : France uniquement ou international ?

Réponds avec l'ordre souhaité (ex : "Lot 1 d'abord") et je démarre immédiatement.
