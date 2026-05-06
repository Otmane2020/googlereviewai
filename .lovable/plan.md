## Goal

Make the app fully bilingual (FR / EN) with a visible flag switcher in the top bar of the app, on the home page, on `/auth`, and in Settings. Default stays French; user choice persists.

## Current State

- `src/i18n/config.ts` is hard-locked to `lng: "fr"` and forces `localStorage` to `fr`. `isLikelyFrench()` always returns `true`.
- `src/components/LanguageSwitcher.tsx` has an early `return null` — switcher is hidden everywhere.
- Only 14 of ~150 components use `useTranslation`. The rest are hardcoded French strings (Dashboard, Reviews, Businesses, AEORank, SEOAutoPost, MapsRank, Calendar, Notifications, AISettings, Admin, Checkout, Onboarding, all Ranki sections, etc.).
- `en.json` already exists (647 lines) but only mirrors the keys that components actually use; the rest of the app has no English source.

## Plan

### 1. Re-enable the i18n engine
- `src/i18n/config.ts`: detect language from `localStorage` first, then `navigator.language`; fall back to `fr`. Replace the forced `localStorage.setItem("fr")` and the always-true `isLikelyFrench`.

### 2. Re-enable the LanguageSwitcher
- `src/components/LanguageSwitcher.tsx`: remove the `return null` early-exit so the existing flags/dropdown variants render.

### 3. Place the switcher where requested
- **App top bar** (logged-in): add to `src/components/DashboardHeader.tsx` (right side, next to credits/avatar) using `variant="dropdown"`.
- **Home page top bar**: already wired in `src/components/Header.tsx` — verify it shows on desktop + mobile.
- **/auth page**: add to `src/pages/Auth.tsx` (top-right of the auth card).
- **Settings page**: add a "Langue / Language" row in `src/pages/Settings.tsx` with the dropdown variant.

### 4. Translate the rest of the app to English

Two layers:

**a. Components already using `useTranslation`** — extend `en.json` and `fr.json` with any missing keys those files reference (audit by `rg "t\(['\"]"`).

**b. Components with hardcoded French** — convert to `t("...")` and add the keys to both locale files. Priority order (highest user-visible first):
1. `Dashboard.tsx`, `DashboardHeader.tsx`, `MobileBottomNav.tsx`, `Sidebar` items
2. `Reviews.tsx`, `Businesses.tsx`, `Calendar.tsx`, `Notifications.tsx`
3. `AEORank.tsx`, `SEOAutoPost.tsx`, `MapsRank.tsx`, `AISettings.tsx`
4. `Auth.tsx` (extend), `Settings.tsx` (extend), `Checkout.tsx`, `PaymentSuccess.tsx`, `PaymentCanceled.tsx`, `Onboarding.tsx`, `ChoosePlan.tsx`
5. Landing sections under `src/components/ranki/*` (Hero, GeoRank, HowItWorks, ReviewsAI, DashboardPreview, Pricing) + `FAQSection`, `CTASection`, `Footer`, `PricingSection`
6. Dialogs/toasts/banners (`UpgradeDialog`, `InstallPrompt`, `NotificationPrompt`, `LowCreditsBanner`, `ReconnectGoogleBanner`, etc.)

Each converted file gets a namespaced section in the locale JSON (e.g. `dashboard.welcomeBack`, `reviews.toReply`, `aeoRank.title`).

### 5. Update memory
- Replace the "100% French UI enforced" core rule with "Bilingual FR/EN; default FR, user-switchable; no mixed-language strings within a single screen."

## Technical notes

- Toast messages (sonner) inside event handlers also need `t()` wrapping.
- `Helmet` `<title>` and `<meta description>` should switch with language on Home / key pages.
- Date formatting (`date-fns`) — pass `locale: i18n.language === "en" ? enUS : fr`.
- Edge function content (AI-generated posts, replies) stays in the user's business language, independent of UI language.

## Scope warning

This is a large change touching ~50 files and adding several hundred translation keys. I'll do it in one pass but expect a long diff. If you want, I can ship it in two phases:
- **Phase 1 (fast)**: switcher works everywhere + already-translated components + Dashboard / Auth / Settings / Header / Footer.
- **Phase 2**: remaining inner pages (Reviews, Businesses, AEO, SEO, Maps, Calendar, etc.).

Tell me **"phase 1 only"** or **"tout d'un coup"** when you approve.
