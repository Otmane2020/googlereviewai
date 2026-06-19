import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

const detectInitialLang = (): "fr" | "en" => {
  try {
    const stored = localStorage.getItem("i18nextLng");
    if (stored === "fr" || stored === "en") return stored;
  } catch {}
  // Auto-detect from browser: French if navigator language starts with fr, else English
  if (typeof navigator !== "undefined") {
    const langs = [navigator.language, ...(navigator.languages || [])].filter(Boolean).map((l) => l.toLowerCase());
    if (langs.some((l) => l.startsWith("fr"))) return "fr";
    return "en";
  }
  return "fr";
};

const initialLng = detectInitialLang();

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: "fr",
  supportedLngs: ["fr", "en"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

i18n.on("languageChanged", (lng) => {
  try { localStorage.setItem("i18nextLng", lng); } catch {}
  if (typeof document !== "undefined") document.documentElement.lang = lng;
});

if (typeof document !== "undefined") document.documentElement.lang = initialLng;

export const isLikelyFrench = () => i18n.language?.startsWith("fr") ?? true;
export default i18n;
