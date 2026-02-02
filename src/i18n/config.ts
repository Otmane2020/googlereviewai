import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr.json";
import en from "./locales/en.json";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// Helper to check if user is likely from France
const isLikelyFrench = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const lang = navigator.language || (navigator as any).userLanguage;
  return lang?.toLowerCase().startsWith("fr");
};

// Determine initial language synchronously
const getInitialLanguage = (): string => {
  // First check localStorage
  const stored = localStorage.getItem("i18nextLng");
  if (stored && (stored === "fr" || stored === "en" || stored.startsWith("fr") || stored.startsWith("en"))) {
    return stored.startsWith("fr") ? "fr" : "en";
  }
  // Fall back to browser language detection
  return isLikelyFrench() ? "fr" : "en";
};

// Initialize synchronously with determined language
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // Set language explicitly at init
    fallbackLng: "en",
    supportedLngs: ["fr", "en"],
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: false,
    },
  });

export { isLikelyFrench };
export default i18n;
