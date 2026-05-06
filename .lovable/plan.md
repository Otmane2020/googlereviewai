## Goal
Passer l'app **100 % en français**, tout en conservant le bundle anglais (`en.json`) dans le code pour pouvoir réactiver le switcher plus tard sans re-traduire.

## Changements

1. **`src/i18n/config.ts`** — forcer le français
   - `lng: "fr"`, `fallbackLng: "fr"`
   - Garder `en.json` importé et listé dans `supportedLngs: ["fr", "en"]` (prêt à réactiver)
   - Supprimer la détection automatique navigateur/timezone
   - Écrire `localStorage.i18nextLng = "fr"` au boot (écrase tout choix EN précédent)
   - `isLikelyFrench()` retourne `true`

2. **Masquer le switcher de langue** (sans le supprimer)
   - `src/components/LanguageSwitcher.tsx` : early return `null` (composant conservé pour réactivation future)
   - Aucun changement aux endroits qui l'importent (Header landing, page Auth, etc.)

3. **Settings — bloc Langue**
   - `src/pages/Settings.tsx` : masquer la carte « Langue / English / Français » (commenter le JSX, garder le code) puisqu'il n'y a plus de choix à offrir

4. **Sidebar dashboard**
   - Aucun changement de code : les libellés passent automatiquement en français via les clés `sidebar.*` déjà présentes dans `fr.json` (Vue d'ensemble, Avis, Établissements, etc.)

5. **Pages encore en anglais en dur** (sweep ciblé)
   - `src/components/DashboardHeader.tsx` : `Settings`, `Upgrade plan`, `Sign out`, `User`, `credits` → français
   - `src/pages/Settings.tsx` : `Save`, `Subscription`, `Free trial`, `Manage subscription`, `Available credits`, `Max locations`, `See all plans`, `Integrations`, etc.
   - `src/components/Header.tsx` (landing) : `Sign in`, `Start free`, libellés `navLinks`
   - `src/components/HeroSection.tsx` : badges « 100% gratuit / Sans carte bancaire / +500 entreprises » déjà FR ; vérifier les boutons
   - Vérifier rapidement les autres pages dashboard (`AEORank`, `SEOAutoPost`, `Reviews`, `Businesses`, `MapsRank`, `GmbPost`, `Calendar`, `Notifications`, `AISettings`) et remplacer les chaînes EN restantes par leurs équivalents FR (ou clés `t()` quand la clé existe déjà dans `fr.json`)

6. **Landing page**
   - `HeroSection`, `FeaturesSection`, `PricingSection`, `FAQSection`, `Footer`, `CTASection`, `TestimonialsSection`, sections Ranki (`RankiHero`, `GeoRankSection`, `ReviewsAISection`, `HowItWorksSection`, `RankiPricingSection`) : remplacer toute chaîne EN en dur par du français (la plupart utilisent déjà `t()` qui basculera tout seul)

7. **Mémoire projet**
   - Mettre à jour `mem://brand/language-purity-constraint` : « App 100 % FR. Bundle EN conservé mais désactivé via `lng:"fr"` figé. Pour réactiver : retirer le `return null` dans `LanguageSwitcher` et restaurer la détection dans `i18n/config.ts`. »

## Hors scope
- Articles de blog (déjà bilingues côté DB, l'UI pivote selon `i18n.language`)
- Edge functions (réponses IA générées dans la langue de l'avis)

## Note technique
Le bundle EN reste chargé en mémoire (~quelques Ko gzip). Coût négligeable, gain : réactivation instantanée du multilingue plus tard sans refaire les traductions.
