/** Cloudflare Workers AI primary, OpenRouter secondary. Server-only credentials. */
export type GeneratedGmbImage = {
  bytes: Uint8Array;
  mime: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
  provider: "cloudflare" | "openrouter";
};
const MIN = 5000;
const MAX = 10_000_000;

function detectImage(bytes: Uint8Array): Pick<GeneratedGmbImage, "mime" | "extension"> {
  if (bytes.length < MIN || bytes.length > MAX) throw new Error("Taille d'image invalide (5 Ko à 10 Mo).");
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return { mime: "image/png", extension: "png" };
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }
  throw new Error("Réponse invalide : ni JPEG, ni PNG, ni WebP.");
}

export function parseGeneratedImageBase64(input: string, provider: GeneratedGmbImage["provider"]): GeneratedGmbImage {
  const value = input.trim().replace(/^data:image\/(?:png|jpeg|jpg|webp)(?:;charset=[\w-]+)?;base64,/i, "").replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error("Image Base64 invalide.");
  if (Math.floor(value.length * .75) < MIN || Math.floor(value.length * .75) > MAX + 3) throw new Error("Taille Base64 invalide.");
  const bytes = Uint8Array.from(atob(value), (ch) => ch.charCodeAt(0));
  return { bytes, ...detectImage(bytes), provider };
}

async function cloudflareImage(prompt: string): Promise<GeneratedGmbImage> {
  const account = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || Deno.env.get("CF_ACCOUNT_ID");
  const token = Deno.env.get("CLOUDFLARE_API_TOKEN") || Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_WORKERS_AI_TOKEN");
  if (!account || !token) throw new Error("Secrets Cloudflare Workers AI manquants.");
  const response = await fetch(
    "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(account) + "/ai/run/@cf/black-forest-labs/flux-1-schnell",
    { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.slice(0, 2048), steps: 4 }), signal: AbortSignal.timeout(45000) },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { errors?: { message?: string }[] } | null;
    if (response.status === 401 || response.status === 403) throw new Error("Cloudflare : token invalide ou permission Workers AI manquante.");
    const msg = payload?.errors?.map((x) => x.message).filter(Boolean).join("; ");
    throw new Error("Cloudflare HTTP " + response.status + (msg ? ": " + msg.slice(0, 170) : ""));
  }
  if ((response.headers.get("content-type") || "").startsWith("image/")) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { bytes, ...detectImage(bytes), provider: "cloudflare" };
  }
  const payload = await response.json() as {
    success?: boolean; result?: { image?: string }; image?: string; errors?: { message?: string }[];
  };
  const image = payload.result?.image || payload.image;
  if (payload.success === false || !image) {
    throw new Error(payload.errors?.map((x) => x.message).filter(Boolean).join("; ") || "Cloudflare n'a retourné aucune image.");
  }
  return parseGeneratedImageBase64(image, "cloudflare");
}

async function openRouterImage(prompt: string): Promise<GeneratedGmbImage> {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("Clé OpenRouter manquante.");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: {
      Authorization: "Bearer " + key, "Content-Type": "application/json",
      "HTTP-Referer": "https://reviewsai.store", "X-Title": "ReviewsAI Google Business images",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image", modalities: ["image", "text"],
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(65000),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error("OpenRouter HTTP " + response.status + (payload?.error?.message ? ": " + payload.error.message.slice(0, 170) : ""));
  }
  const payload = await response.json() as {
    choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    error?: { message?: string };
  };
  const image = payload.choices?.[0]?.message?.images?.find(x => x.image_url?.url?.startsWith("data:image/"))?.image_url?.url;
  if (!image) throw new Error(payload.error?.message || "OpenRouter n'a retourné aucune image.");
  return parseGeneratedImageBase64(image, "openrouter");
}

export async function generateGmbImageBytes(prompt: string): Promise<GeneratedGmbImage> {
  const hasCf = Boolean(
    (Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || Deno.env.get("CF_ACCOUNT_ID")) &&
    (Deno.env.get("CLOUDFLARE_API_TOKEN") || Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_WORKERS_AI_TOKEN")),
  );
  const hasOr = Boolean(Deno.env.get("OPENROUTER_API_KEY"));
  if (!hasCf && !hasOr) {
    throw new Error("Configurez les secrets CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN (Workers AI), ou OPENROUTER_API_KEY, sur le backend.");
  }
  const errors: string[] = [];
  if (hasCf) {
    try { return await cloudflareImage(prompt); }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[GMB images] Cloudflare:", msg);
      errors.push(msg);
    }
  }
  if (hasOr) {
    try { return await openRouterImage(prompt); }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[GMB images] OpenRouter:", msg);
      errors.push(msg);
    }
  }
  throw new Error("Génération d'image impossible : " + errors.join(" | ").slice(0, 450));
}
