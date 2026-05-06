import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

const FRENCH_LOCALES = ["fr", "fr-FR", "fr-BE", "fr-CH", "fr-CA", "fr-LU", "fr-MC"];
const FRENCH_REGIONS = ["FR", "BE", "CH", "CA", "LU", "MC", "SN", "CI", "MA", "TN", "DZ"];

const detectLanguage = (): "fr" | "en" => {
  try {
    const stored = localStorage.getItem("i18nextLng");
    if (stored === "fr" || stored === "en") return stored;
  } catch {}

  try {
    const langs = (typeof navigator !== "undefined" && (navigator.languages || [navigator.language])) || [];
    for (const l of langs) {
      if (!l) continue;
      const lower = l.toLowerCase();
      if (lower.startsWith("fr")) return "fr";
      const region = lower.split("-")[1]?.toUpperCase();
      if (region && FRENCH_REGIONS.includes(region)) return "fr";
    }
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Paris|Brussels|Geneva|Zurich|Luxembourg|Monaco|Montreal|Dakar|Abidjan|Casablanca|Tunis|Algiers/i.test(tz)) {
        return "fr";
      }
    } catch {}
  } catch {}
  return "en";
};

const initial = detectLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: initial,
  fallbackLng: "en",
  supportedLngs: ["en", "fr"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

try {
  localStorage.setItem("i18nextLng", initial);
} catch {}

export const isLikelyFrench = () => i18n.language?.startsWith("fr") ?? false;
export default i18n;
