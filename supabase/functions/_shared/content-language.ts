/**
 * Review replies follow the ORIGINAL text from Google, not app language,
 * account language or translated text appended to imported Google reviews.
 * SEO/GEO content is governed separately by the chosen Google location.
 */
export function originalGoogleReviewText(comment?: string | null): string {
  const text = String(comment || "").trim();
  if (!text) return "";
  // Google appends an English translation to some reviews imported via its API.
  // The first paragraph(s) are the author's actual words.
  return text.split(/\n\s*\((?:translated by google|traduit par google|traducido por google|traduzido pelo google|übersetzt von google|tradotto da google)\)\s*(?:\n|$)/i)[0].trim();
}

export function normalizeContentLanguage(raw?: string | null, fallback = "fr"): string {
  const match = String(raw || "").trim().toLowerCase().replace(/_/g, "-").match(/^([a-z]{2,3})(?:-|$)/);
  return match?.[1] || fallback;
}

const words: Record<string, string[]> = {
  fr: ["je", "nous", "vous", "les", "des", "une", "avec", "très", "merci", "pour", "mais", "chez", "vraiment", "livraison", "équipe", "achat", "accueil", "bien", "superbe", "parfait", "excellent", "recommande", "produit", "suis", "était", "qualité", "service", "rapide", "beaucoup", "notre", "leur"],
  en: ["the", "and", "for", "with", "thank", "thanks", "very", "great", "lovely", "delivery", "staff", "team", "really", "excellent", "good", "amazing", "was", "were", "would", "again", "highly", "recommend", "purchase", "nice", "helpful", "quick", "friendly", "experience", "love", "best"],
  es: ["muy", "gracias", "para", "con", "una", "los", "las", "del", "todo", "servicio", "excelente", "recomiendo", "bueno", "buena", "atención", "compra", "rápido", "estoy", "experiencia", "personal", "volveré", "muchas"],
  de: ["und", "der", "die", "das", "mit", "für", "sehr", "danke", "gute", "gut", "waren", "freundlich", "schnell", "lieferung", "empfehlen", "immer", "wieder", "super", "tolles", "toller", "service"],
  it: ["molto", "grazie", "per", "con", "una", "sono", "stato", "stata", "ottimo", "ottima", "servizio", "consegna", "consiglio", "personale", "esperienza", "bellissimo", "veloce", "gentile"],
  pt: ["muito", "obrigado", "obrigada", "para", "com", "uma", "não", "ótimo", "ótima", "atendimento", "entrega", "recomendo", "excelente", "equipe", "experiência", "rápido", "bom", "boa"],
  nl: ["heel", "bedankt", "voor", "met", "een", "het", "van", "goed", "goede", "snelle", "levering", "vriendelijk", "aanrader", "geweldig", "tevreden", "erg", "service"],
};
const distinctive: Record<string, string[]> = {
  fr: ["très", "équipe", "livraison", "accueil", "chez", "suis", "était", "qualité", "recommande", "parfait", "superbe", "vraiment"],
  en: ["the", "and", "with", "thanks", "staff", "delivery", "helpful", "friendly", "really", "would", "highly"],
  es: ["gracias", "muy", "atención", "recomiendo", "volveré", "compra", "muchas"],
  de: ["und", "sehr", "danke", "freundlich", "lieferung", "schnell", "wieder"],
  it: ["grazie", "molto", "consegna", "consiglio", "gentile", "bellissimo"],
  pt: ["obrigado", "obrigada", "muito", "atendimento", "entrega", "recomendo", "equipe"],
  nl: ["bedankt", "heel", "levering", "vriendelijk", "geweldig", "aanrader"],
};

/**
 * Fast, no-extra-API-call language hint. Low-confidence replies fall back to
 * the location's locale, while the LLM is explicitly instructed to inspect
 * the original text itself. This is a hint, not a translation operation.
 */
export function reviewOriginalLanguage(comment?: string | null, fallback?: string | null): string {
  const original = originalGoogleReviewText(comment);
  const defaultLang = normalizeContentLanguage(fallback, "fr");
  if (!original) return defaultLang;
  if (/[\u0600-\u06ff]/u.test(original)) return "ar";
  if (/[\u0900-\u097f]/u.test(original)) return "hi";
  if (/[\u3040-\u30ff]/u.test(original)) return "ja";
  if (/[\uac00-\ud7af]/u.test(original)) return "ko";
  if (/[\u4e00-\u9fff]/u.test(original)) return "zh";
  if (/[\u0400-\u04ff]/u.test(original)) return "ru";

  const tokens = original.toLowerCase().match(/[\p{L}]+/gu) || [];
  if (!tokens.length) return defaultLang;
  const scores = Object.entries(words).map(([language, list]) => {
    const lexicon = new Set(list);
    const strong = new Set(distinctive[language]);
    const score = tokens.reduce((total, token) =>
      total + (lexicon.has(token) ? (strong.has(token) ? 3 : 1) : 0), 0);
    return { language, score };
  }).sort((a, b) => b.score - a.score);
  if (scores[0].score >= 3 && scores[0].score > (scores[1]?.score || 0)) {
    return scores[0].language;
  }
  return defaultLang;
}

export function languageLabel(code: string): string {
  const lang = normalizeContentLanguage(code);
  return ({
    fr: "French", en: "English", es: "Spanish", de: "German",
    it: "Italian", pt: "Portuguese", nl: "Dutch", ar: "Arabic",
    hi: "Hindi", ja: "Japanese", ko: "Korean", zh: "Chinese", ru: "Russian",
  } as Record<string, string>)[lang] || lang;
}

/** Always take the location-specific GMB locale. Account/UI are never used for a known location. */
export function gmbContentLanguage(locationLanguage?: string | null, fallback = "fr"): string {
  return normalizeContentLanguage(locationLanguage, normalizeContentLanguage(fallback));
}

export function googlePostLanguageCode(locationLanguage?: string | null): string {
  const normalized = String(locationLanguage || "").trim().replace(/_/g, "-");
  if (/^[a-z]{2,3}-[a-z]{2}$/i.test(normalized)) {
    const [lang, region] = normalized.split("-");
    return lang.toLowerCase() + "-" + region.toUpperCase();
  }
  const lang = gmbContentLanguage(normalized);
  return ({ fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", pt: "pt-PT",
    nl: "nl-NL", hi: "hi-IN", ar: "ar-SA", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
  } as Record<string, string>)[lang] || (lang + "-" + lang.toUpperCase());
}
