import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["fr", "en"],
    
    detection: {
      // Order of language detection
      order: ["localStorage", "navigator", "htmlTag"],
      // Cache language in localStorage
      caches: ["localStorage"],
      // Key used in localStorage
      lookupLocalStorage: "i18nextLng",
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: false,
    },
  });

// Helper to check if user is likely from France
export const isLikelyFrench = (): boolean => {
  const lang = navigator.language || (navigator as any).userLanguage;
  return lang?.toLowerCase().startsWith("fr");
};

// Set initial language based on detection
if (!localStorage.getItem("i18nextLng")) {
  const defaultLang = isLikelyFrench() ? "fr" : "en";
  i18n.changeLanguage(defaultLang);
}

export default i18n;
