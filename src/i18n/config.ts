import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export type AppLanguage = "fr" | "en";

const LANGUAGE_KEY = "app_language";
const EXPLICIT_LANGUAGE_KEY = "app_language_explicit";
const LEGACY_LANGUAGE_KEY = "i18nextLng";
const OAUTH_LANGUAGE_KEY = "oauth_language";

export const normalizeLanguage = (value: string | null | undefined): AppLanguage | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().split("-")[0];
  return normalized === "fr" || normalized === "en" ? normalized : null;
};

const browserLanguage = (): AppLanguage => {
  if (typeof navigator === "undefined") return "en";
  const languages = [navigator.language, ...(navigator.languages || [])]
    .map(normalizeLanguage)
    .filter(Boolean) as AppLanguage[];
  return languages.includes("fr") ? "fr" : "en";
};

export const getExplicitLanguage = (): AppLanguage | null => {
  try {
    const explicit = normalizeLanguage(localStorage.getItem(EXPLICIT_LANGUAGE_KEY));
    if (explicit) return explicit;

    // Migrate the legacy preference. It was the only persisted language choice.
    const hasCurrentKey = normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));
    const legacy = normalizeLanguage(localStorage.getItem(LEGACY_LANGUAGE_KEY));
    if (!hasCurrentKey && legacy) {
      localStorage.setItem(LANGUAGE_KEY, legacy);
      localStorage.setItem(EXPLICIT_LANGUAGE_KEY, legacy);
      return legacy;
    }
  } catch {}
  return null;
};

export const getPreferredLocalLanguage = (): AppLanguage => {
  try {
    return (
      getExplicitLanguage() ||
      normalizeLanguage(localStorage.getItem(LANGUAGE_KEY)) ||
      browserLanguage()
    );
  } catch {
    return browserLanguage();
  }
};

export const persistLanguage = (language: AppLanguage, explicit = false) => {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
    localStorage.setItem(LEGACY_LANGUAGE_KEY, language);
    if (explicit) localStorage.setItem(EXPLICIT_LANGUAGE_KEY, language);
  } catch {}
  if (typeof document !== "undefined") document.documentElement.lang = language;
};

export const preserveLanguageForOAuth = () => {
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language) || getPreferredLocalLanguage();
  persistLanguage(language);
  try { sessionStorage.setItem(OAUTH_LANGUAGE_KEY, language); } catch {}
  return language;
};

export const restoreLanguageAfterOAuth = async (): Promise<AppLanguage> => {
  let language: AppLanguage | null = null;
  try { language = normalizeLanguage(sessionStorage.getItem(OAUTH_LANGUAGE_KEY)); } catch {}
  language = language || getPreferredLocalLanguage();
  persistLanguage(language);
  if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== language) {
    await i18n.changeLanguage(language);
  }
  try { sessionStorage.removeItem(OAUTH_LANGUAGE_KEY); } catch {}
  return language;
};

const initialLng = getPreferredLocalLanguage();
persistLanguage(initialLng);

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

i18n.on("languageChanged", (value) => {
  const language = normalizeLanguage(value) || "en";
  persistLanguage(language);
});

if (typeof document !== "undefined") document.documentElement.lang = initialLng;

export const isLikelyFrench = () =>
  normalizeLanguage(i18n.resolvedLanguage || i18n.language) === "fr";

export default i18n;
