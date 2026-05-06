// Shared AI caller with free-tier first + paid fallback
// Tries OpenRouter free models, then Lovable AI Gateway (free Gemini) as ultimate fallback.

export const OPENROUTER_FALLBACK_MODELS = [
  // Currently-available OpenRouter free models (Nov 2025)
  "deepseek/deepseek-chat-v3.1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

// Lovable AI Gateway free models (used when OpenRouter is exhausted)
const LOVABLE_AI_FALLBACK_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
];

interface CallOpts {
  messages: any[];
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
  models?: string[];
  referer?: string;
  title?: string;
  apiKey?: string;
}

async function tryEndpoint(
  url: string,
  apiKey: string,
  model: string,
  opts: CallOpts,
  extraHeaders: Record<string, string> = {},
): Promise<{ ok: true; content: string } | { ok: false; retry: boolean; status?: number; error: string }> {
  const body: any = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 4000,
  };
  if (opts.response_format) body.response_format = opts.response_format;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });

  // Retryable: deprecated, rate-limited, insufficient credits, server errors
  if ([402, 404, 429].includes(response.status) || response.status >= 500) {
    const text = await response.text().catch(() => "");
    console.warn(`[AI] ${model} unavailable (${response.status}): ${text.slice(0, 120)}`);
    return { ok: false, retry: true, status: response.status, error: text };
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[AI] ${model} error ${response.status}: ${errText}`);
    return { ok: false, retry: false, status: response.status, error: errText };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || String(content).trim().length === 0) {
    console.warn(`[AI] ${model} returned empty content`);
    return { ok: false, retry: true, error: "empty" };
  }
  console.log(`[AI] ✅ Success with ${model}`);
  return { ok: true, content };
}

export async function callOpenRouterWithFallback(opts: CallOpts): Promise<string> {
  const openrouterKey = opts.apiKey ?? Deno.env.get("OPENROUTER_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const referer = opts.referer ?? "https://starlinko.app";
  const title = opts.title ?? "Starlinko";

  let lastError = "no provider available";
  let lastStatus: number | undefined;

  // 1) Try OpenRouter free models first
  if (openrouterKey) {
    const models = opts.models && opts.models.length > 0 ? opts.models : OPENROUTER_FALLBACK_MODELS;
    for (const model of models) {
      try {
        const r = await tryEndpoint(
          "https://openrouter.ai/api/v1/chat/completions",
          openrouterKey,
          model,
          opts,
          { "HTTP-Referer": referer, "X-Title": title },
        );
        if (r.ok) return r.content;
        lastError = r.error;
        lastStatus = r.status;
        if (!r.retry) break;
      } catch (err) {
        console.error(`[AI:OpenRouter] ${model} threw:`, err);
        lastError = String(err);
      }
    }
  } else {
    console.warn("[AI] OPENROUTER_API_KEY not set, skipping OpenRouter");
  }

  // 2) Fallback: Lovable AI Gateway (free Gemini)
  if (lovableKey) {
    console.log("[AI] Falling back to Lovable AI Gateway");
    for (const model of LOVABLE_AI_FALLBACK_MODELS) {
      try {
        const r = await tryEndpoint(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          lovableKey,
          model,
          opts,
        );
        if (r.ok) return r.content;
        lastError = r.error;
        lastStatus = r.status;
      } catch (err) {
        console.error(`[AI:Lovable] ${model} threw:`, err);
        lastError = String(err);
      }
    }
  } else {
    console.warn("[AI] LOVABLE_API_KEY not set, skipping Lovable AI fallback");
  }

  throw new Error(`All AI providers exhausted (last status ${lastStatus}): ${lastError}`);
}
