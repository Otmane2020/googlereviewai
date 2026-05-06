// Shared OpenRouter caller with free-tier first + paid fallback
// Used by: generate-ai-response, auto-respond-reviews, generate-demo-response,
// analyze-brand-voice, cron-generate-daily-seo, generate-seo-content,
// generate-old-reviews-batch, cron-generate-daily-qa

export const OPENROUTER_FALLBACK_MODELS = [
  // Free tier (no charge) — try first
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2-7b-instruct:free",
  // Paid ultra-cheap fallback (last resort)
  "google/gemini-flash-1.5",
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
];

interface CallOpts {
  messages: any[];
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
  models?: string[]; // override fallback list if needed
  referer?: string;
  title?: string;
  apiKey?: string;
}

/**
 * Calls OpenRouter, falling back through a list of models on 404/429/empty responses.
 * Returns the raw assistant content string.
 */
export async function callOpenRouterWithFallback(opts: CallOpts): Promise<string> {
  const apiKey = opts.apiKey ?? Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const models = opts.models && opts.models.length > 0 ? opts.models : OPENROUTER_FALLBACK_MODELS;
  const referer = opts.referer ?? "https://starlinko.app";
  const title = opts.title ?? "Starlinko";

  let lastError: unknown = null;

  for (const model of models) {
    try {
      console.log(`[OpenRouter] Trying model: ${model}`);

      const body: any = {
        model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.max_tokens ?? 4000,
      };
      if (opts.response_format) body.response_format = opts.response_format;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": title,
        },
        body: JSON.stringify(body),
      });

      // 404 = model deprecated/unavailable, 429 = rate limit → try next
      if (response.status === 404 || response.status === 429) {
        console.warn(`[OpenRouter] ${model} unavailable (${response.status}), trying next…`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[OpenRouter] ${model} error ${response.status}: ${errText}`);
        lastError = new Error(`${model}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content || String(content).trim().length === 0) {
        console.warn(`[OpenRouter] ${model} returned empty content, trying next…`);
        continue;
      }

      console.log(`[OpenRouter] ✅ Success with ${model}`);
      return content;
    } catch (err) {
      console.error(`[OpenRouter] ${model} threw:`, err);
      lastError = err;
      continue;
    }
  }

  throw new Error(`All OpenRouter models exhausted. Last error: ${lastError}`);
}
