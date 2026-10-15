/**
 * Review-reply sign-offs use the public BRAND, not the full descriptive Google
 * Business Profile listing ("Sweet Deco - Grossiste de Meubles" -> "Sweet Deco").
 * This pure helper is reused by manual, automatic, batch and demo generation.
 */
export function shortReviewBrandName(value?: string | null): string {
  let name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name || /^(?:notre établissement|our establishment|notre équipe|our team)$/i.test(name)) {
    return "";
  }

  // A dash, bullet, pipe or colon on a Google listing usually separates the
  // recognizable company name from its activity/category or location.
  const primary = name.split(/\s+[-–—|•·]\s+|\s*\|\s*|:\s+/)[0]?.trim();
  if (primary && primary.length >= 2) name = primary;

  // Also handle listings without punctuation: "Sweet Deco grossiste de meubles".
  const descriptor = /\s+(?:[,([]\s*)?(?:grossiste(?:\s+de|\s+en)?|spécialiste(?:\s+de|\s+en)?|specialist(?:\s+in)?|vente\s+de|vente\s+en\s+gros\s+de|magasin\s+de|boutique\s+de|service\s+de|prestataire\s+de|fournisseur\s+de|wholesale(?:r)?\s+(?:of|furniture)?|furniture\s+wholesaler|retail\s+store)\b/i;
  const descriptorAt = name.search(descriptor);
  if (descriptorAt > 1) name = name.slice(0, descriptorAt);

  return name.replace(/[\s,;:—–\-]+$/g, "").trim();
}

type SignatureInput = {
  businessName?: string | null;
  language?: string | null;
  configuredSignature?: string | null;
  includeSignature?: boolean | null;
  legacyAccountFullName?: string | null;
};

export function defaultReviewSignature(businessName?: string | null, language?: string | null): string {
  const brand = shortReviewBrandName(businessName);
  return (language || "").toLowerCase().startsWith("en")
    ? (brand ? `— The ${brand} team` : "— The team")
    : (brand ? `— L'équipe ${brand}` : "— L'équipe");
}

export function resolveReviewSignature({
  businessName, language, configuredSignature, includeSignature, legacyAccountFullName,
}: SignatureInput): string {
  if (includeSignature === false) return "";

  const stored = (configuredSignature || "").trim();
  const plain = stored.replace(/^[—–-]\s*/, "").trim().replace(/[’]/g, "'");

  // Earlier defaults were either the literal "The {business_name} team"
  // or an onboarding-generated "L'équipe <user's personal name>".
  // Recognize ONLY these defaults, so genuinely custom signatures survive.
  const templateNames = [
    "The {business_name} team",
    "The team at {business_name}",
    "L'équipe {business_name}",
    "L'équipe {nom_etablissement}",
  ];
  const matchesDefaultTemplate = templateNames.some(x => x.toLowerCase() === plain.toLowerCase());
  const person = (legacyAccountFullName || "").trim();
  const matchesOnboardingPersonalName = !!person && [
    `L'équipe ${person}`, `The ${person} team`,
  ].some(x => x.toLowerCase() === plain.toLowerCase());

  if (!stored || matchesDefaultTemplate || matchesOnboardingPersonalName) {
    return defaultReviewSignature(businessName, language);
  }

  // A user-entered signature must take priority. If the user intentionally
  // includes an establishment placeholder, expand to the SHORT brand only.
  const brand = shortReviewBrandName(businessName);
  return stored.replace(/\{(?:business_name|nom_etablissement)\}/gi, brand);
}

/**
 * The model may ignore sign-off instructions or copy the long listing name.
 * Keep generated reply prose intact but normalize a final generic team line,
 * and append the exact selected default/custom sign-off only once.
 */
export function ensureReviewSignature(reply: string, signature: string): string {
  const clean = String(reply || "").trim();
  if (!signature || !clean) return clean;

  const target = signature.trim();
  const normalized = (s: string) => s.replace(/^[—–-]\s*/, "").trim().replace(/’/g, "'").toLowerCase();
  const lines = clean.split("\n");
  const last = lines[lines.length - 1]?.trim() || "";

  if (normalized(last) === normalized(target)) {
    lines[lines.length - 1] = target;
    return lines.join("\n").trim();
  }

  // Only remove a last-line sign-off when it is clearly a TEAM signature,
  // not meaningful reply content or an unrelated user sign-off.
  if (/^[—–-]?\s*(?:l['’]équipe\b|the\s+(?:[\p{L}\p{N}&.'’-]+\s+){0,8}team\b|the\s+team\b)/iu.test(last)) {
    lines.pop();
  }

  return `${lines.join("\n").trim()}\n\n${target}`;
}
