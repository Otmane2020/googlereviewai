import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr.json";
import en from "./locales/en.json";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// Helper to check if user is likely French-speaking based on browser locale
// Covers: France (fr-FR), Belgium (fr-BE), Switzerland (fr-CH), Canada (fr-CA), Luxembourg (fr-LU), Monaco (fr-MC)
var isLikelyFrench = function(): boolean {
  if (typeof navigator === "undefined") return false;
  
  // Get browser languages with multiple fallbacks for old browsers
  var navLangs = navigator.languages;
  var navLang = navigator.language;
  var userLang = (navigator as any).userLanguage;
  var languages = navLangs && navLangs.length > 0 ? navLangs : [navLang || userLang || 'en'];
  
  // Check if any preferred language is French
  for (var i = 0; i < languages.length; i++) {
    var lang = languages[i];
    if (!lang) continue;
    var normalizedLang = lang.toLowerCase();
    
    // If any language starts with 'fr', user likely prefers French
    if (normalizedLang.indexOf('fr') === 0) {
      return true;
    }
  }
  
  return false;
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
