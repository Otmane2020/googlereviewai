import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";

// Ranki.ai is an English-only product. We keep i18next so existing t() calls
// continue to work, but force the language to English everywhere.
const resources = {
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Persist preference so any legacy localStorage logic resolves to English too.
try {
  localStorage.setItem("i18nextLng", "en");
} catch {
  // ignore (private mode, SSR, etc.)
}

export const isLikelyFrench = () => false;
export default i18n;
