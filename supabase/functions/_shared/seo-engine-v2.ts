// SEO engine v2: source validation, safe keyword discovery, measured demand, scoring.
export const normalizeText=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function sourceQuality(name:string,description:string){
  const normalized=normalizeText(description);
  const brand=normalizeText(name);
  // Explicit cross-brand contamination previously observed in real ReviewsAI data.
  if(normalized.includes("sweet deco")&&!brand.includes("sweet deco"))return {safe:false,reason:"BRAND_CONTEXT_MISMATCH"};
  return {safe:true,reason:null};
}
export function seedKeywords(keywords:string[],categories:string[]):string[]{
  // Measure concise commercial head terms alongside long-tail local intents,
  // instead of relying solely on ultra-local, unmeasurable Google Ads queries.
  const seeds=[...keywords,...categories];
  for(const keyword of keywords){
    const base=keyword.replace(/\b\d{2,5}\b/g," ").replace(/\b(lognes|torcy|noisiel|champs sur marne|ile de france|idf)\b/gi," ").replace(/\s+/g," ").trim();
    if(base.split(/\s+/).length>=2&&base!==keyword)seeds.push(base);
  }
  return [...new Map(seeds.filter(x=>x.trim().length>2).map(x=>[normalizeText(x),x.trim()])).values()].slice(0,40);
}
