// Ranki.ai Article Intelligence Engine: portable keyword qualification/scoring subset.
// Adapted for the Google Business Profile / local business use case.
// Every measurable search-demand input comes from DataForSEO; null stays null.
export type Intent = "informational" | "commercial" | "transactional" | "navigational" | "local";
export type Opportunity = {
  keyword: string; cluster: string; intent: Intent; source: "ai_discovery" | "gmb" | "site";
  volume: number | null; cpc: number | null; competition: number | null;
  relevanceScore: number; businessValueScore: number; seoEvidenceScore: number;
  opportunityScore: number; validated: boolean; rejectionReason?: string;
};
const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function computeOpportunityScore(k: Pick<Opportunity,"relevanceScore"|"businessValueScore"|"seoEvidenceScore"|"volume"|"competition">): number {
  const demand = k.volume == null ? 0 : clamp(Math.log10(Math.max(1, k.volume)) / 4 * 100) * .15;
  const competition = k.competition == null ? 0 : clamp(100 - k.competition) * .1;
  return Math.round(clamp(k.businessValueScore) * .3 + clamp(k.relevanceScore) * .25 + clamp(k.seoEvidenceScore) * .2 + demand + competition);
}
function inferIntent(keyword: string): Intent {
  if (/\b(acheter|prix|devis|commande|réserver|buy|price|quote|order)\b/i.test(keyword)) return "transactional";
  if (/\b(comparatif|meilleur|best|compare|top)\b/i.test(keyword)) return "commercial";
  if (/\b(comment|pourquoi|how|what|why|guide)\b/i.test(keyword)) return "informational";
  if (/\b(à|près de|proche de|near|in|around)\b/i.test(keyword)) return "local";
  return "commercial";
}
export function rankLocalKeywords(input: {
  keywords: string[]; name: string; description: string; categories: string[];
  websiteContent: string; address: string;
  measured: { keyword: string; volume: number | null; cpc: number | null; competition: number | null }[];
}): Opportunity[] {
  const evidence = normalize([input.description, ...input.categories, input.websiteContent].join(" "));
  const brand = normalize(input.name);
  const brandTokens = brand.split(" ").filter(w => w.length > 3);
  const localTokens = normalize(input.address).split(" ").filter(w => w.length > 4);
  const metrics = new Map(input.measured.map(m => [normalize(m.keyword), m]));
  const dedup = new Set<string>();
  return input.keywords.flatMap(keyword => {
    const key = normalize(keyword);
    if (!key || dedup.has(key)) return [];
    dedup.add(key);
    const words = key.split(" ").filter(w => w.length > 3);
    const matches = words.filter(w => evidence.includes(w)).length;
    const fraction = words.length ? matches / words.length : 0;
    const branded = brandTokens.length > 0 && brandTokens.every(w => key.includes(w));
    const localMatch = localTokens.some(w => key.includes(w));
    const relevanceScore = clamp(Math.round(40 + fraction * 55 + (localMatch ? 5 : 0)));
    const intent = inferIntent(keyword);
    const businessValueScore = clamp(Math.round(50 + fraction * 30 + (["commercial","transactional","local"].includes(intent) ? 15 : 0)));
    const seoEvidenceScore = clamp(Math.round(fraction * 100));
    const m = metrics.get(key);
    const validated = relevanceScore >= 65 && !branded;
    const result: Opportunity = { keyword, cluster: words.slice(0, 2).join(" ") || key, intent,
      source: input.websiteContent && fraction > .5 ? "site" : "gmb",
      volume: m?.volume ?? null, cpc: m?.cpc ?? null, competition: m?.competition ?? null,
      relevanceScore, businessValueScore, seoEvidenceScore,
      opportunityScore: computeOpportunityScore({ relevanceScore, businessValueScore, seoEvidenceScore, volume: m?.volume ?? null, competition: m?.competition ?? null }),
      validated, ...(!validated ? { rejectionReason: branded ? "branded_keyword" : "insufficient_first_party_relevance" } : {}) };
    return [result];
  }).sort((a,b) => b.opportunityScore-a.opportunityScore);
}
