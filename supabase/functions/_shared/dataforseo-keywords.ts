// Adapted from Ranki.ai's DataForSEO search-volume measurement pipeline.
// Server-only credentials; never return estimated volumes when DataForSEO is unavailable.
export interface KeywordMeasurement {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  competition: number | null;
}
const normalized = (value: string) => value.replace(/\s*\([^)]{1,24}\)\s*/g, " ").normalize("NFKC")
  .replace(/&/g, " and ").replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim()
  .split(/\s+/).slice(0, 10).join(" ").slice(0, 80);

export async function measureKeywordDemand(
  keywords: string[], locationName: string, languageName: string
): Promise<{ measured: KeywordMeasurement[]; status: "measured" | "not_configured" | "unavailable" }> {
  const empty = keywords.map(keyword => ({ keyword, volume: null, cpc: null, competition: null }));
  const login = Deno.env.get("DATAFORSEO_LOGIN");
  const password = Deno.env.get("DATAFORSEO_API_KEY") || Deno.env.get("DATAFORSEO_PASSWORD");
  if (!login || !password) return { measured: empty, status: "not_configured" };
  const prepared = keywords.slice(0, 100).map(keyword => ({ keyword, request: normalized(keyword) })).filter(x => x.request);
  if (!prepared.length) return { measured: empty, status: "unavailable" };
  try {
    const response = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${login}:${password}`)}`, "Content-Type": "application/json" },
      body: JSON.stringify([{ keywords: [...new Set(prepared.map(x => x.request))], location_name: locationName, language_name: languageName }]),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const task = json?.tasks?.[0];
    if (task?.status_code && task.status_code >= 40000) throw new Error(String(task.status_message));
    const values = new Map<string, { volume: number | null; cpc: number | null; competition: number | null }>();
    for (const row of task?.result || []) {
      values.set(normalized(String(row.keyword || "")).toLowerCase(), {
        volume: typeof row.search_volume === "number" ? row.search_volume : null,
        cpc: typeof row.cpc === "number" ? row.cpc : null,
        competition: typeof row.competition_index === "number" ? row.competition_index : null,
      });
    }
    return {
      status: "measured",
      measured: prepared.map(({ keyword, request }) => ({ keyword, ...(values.get(request.toLowerCase()) || { volume: null, cpc: null, competition: null }) })),
    };
  } catch (error) {
    console.error("[DataForSEO] Keyword measurement unavailable", error);
    return { measured: empty, status: "unavailable" };
  }
}
