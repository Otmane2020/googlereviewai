## Audit des onglets sidebar

| Page | Lignes | useTranslation | Chaînes en dur |
|---|---|---|---|
| Dashboard (Overview) | 905 | ❌ Non | ~150+ |
| Reviews (Google Reviews) | 1166 | ⚠️ Partiel (2x) | ~200+ |
| GmbPost (Google Post) | 541 | ❌ Non | ~80 |
| AEORank (GEO Rank AI) | 854 | ❌ Non | ~120 |
| SEOAutoPost (SEO Autopilot) | 753 | ❌ Non | ~100 |
| Calendar (Planning) | 361 | ❌ Non | ~40 |
| Businesses (Locations) | 980 | ❌ Non | ~140 |
| AISettings | 855 | ❌ Non | ~180 |
| Notifications | 302 | ❌ Non | ~40 |
| Settings | 769 | ⚠️ Partiel (2x) | ~80 |

**Total : ~7500 lignes, ~1200+ chaînes à traduire.**

## Stratégie d'exécution

Vu la taille, je propose de procéder **par lots** dans les prochains messages, en respectant cet ordre de priorité (impact utilisateur visible) :

### Lot 1 — Pages les plus visibles (prioritaire)
1. **Dashboard (Overview)** — page d'accueil après login
2. **Reviews** — fonctionnalité principale
3. **Settings** — déjà partiellement traduit, finir
4. **Notifications**

### Lot 2 — Pages secondaires
5. **Businesses (Locations)**
6. **AISettings** — beaucoup de texte technique
7. **GmbPost**

### Lot 3 — Pages spécialisées
8. **AEORank (GEO Rank AI)**
9. **SEOAutoPost**
10. **Calendar (Planning)**

## Méthode pour chaque page

1. Ajouter section dédiée dans `src/i18n/locales/fr.json` et `en.json` (ex : `"dashboardPage": {...}`)
2. Ajouter `import { useTranslation } from "react-i18next"` + `const { t } = useTranslation()`
3. Remplacer tous les textes JSX, placeholders, titres, toasts, labels de boutons par `{t("...")}`
4. Vérifier les sous-composants importés (cards, dialogs) et étendre la traduction si nécessaire

## Composants partagés à traduire en parallèle

Plusieurs composants utilisés dans ces pages contiennent aussi des chaînes en dur :
- `GmbInsightsCard`, `SyncProgressOverlay`, `SyncStatusCard`
- `ReviewCard`, `AutoResponseToggle`, `ResponsePreviewDialog`
- `CreditsDisplay`, `LowCreditsBanner`, `UpgradeDialog`
- `RankingMap`, `maps-rank/*`
- `ConnectGMBDialog`, `SelectBusinessesDialog`
- `SupportDialog`

Je les traduirai en même temps que les pages qui les utilisent.

## Toasts & notifications

Tous les `toast.success(...)` / `toast.error(...)` avec messages en dur seront convertis. Les notifications push (envoyées par edge functions) sont déjà gérées par les edge functions et utilisent la `preferred_language` de la table `profiles`.

## Livrables

À la fin de chaque lot je donnerai un récapitulatif des fichiers modifiés et un changelog FR/EN.

## Confirmation requise

**Approuvez-vous ce plan et l'ordre des lots ?** Si oui, je démarre directement le **Lot 1** (Dashboard + Reviews + Settings + Notifications) au prochain message.
