import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

// App is French-only for now. English bundle is kept loaded so we can
// re-enable the switcher later without re-translating everything.
// To re-enable multilingual: restore navigator/timezone detection here
// and remove the early-return in src/components/LanguageSwitcher.tsx.
i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: "fr",
  fallbackLng: "fr",
  supportedLngs: ["fr", "en"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

try {
  localStorage.setItem("i18nextLng", "fr");
} catch {}

export const isLikelyFrench = () => true;
export default i18n;
