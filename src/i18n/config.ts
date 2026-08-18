import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

// SSR and the first browser render must use the same language to avoid
// hydration mismatches. Browser/profile language is applied after hydration.
const initialLng: "en" = "en";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: "en",
  supportedLngs: ["fr", "en"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem("i18nextLng", lng); } catch {}
  }
  if (typeof document !== "undefined") document.documentElement.lang = lng;
});

export const detectBrowserLanguage = (): "fr" | "en" => {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem("i18nextLng");
    if (stored === "fr" || stored === "en") return stored;
  } catch {}

  if (typeof navigator !== "undefined") {
    const langs = [navigator.language, ...(navigator.languages || [])]
      .filter(Boolean)
      .map((language) => language.toLowerCase());
    if (langs.some((language) => language.startsWith("fr"))) return "fr";
  }
  return "en";
};

export const isLikelyFrench = () => i18n.language?.startsWith("fr") ?? false;
export default i18n;
