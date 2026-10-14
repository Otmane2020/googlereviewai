import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "gmb-generated-images";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

export type GmbImageBusiness = {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  categories?: string[] | null;
  website?: string | null;
};

/** Generate an actual image through the already-configured OpenRouter account. */
export async function generateGmbImage(
  admin: SupabaseClient,
  userId: string,
  business: GmbImageBusiness,
  postText: string,
  postKind: "news" | "information" | "spotlight" = "information",
): Promise<string> {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY is missing. Image generation is not configured.");

  // Rate-limit costly generations on the server, not only in the UI.
  const folder = userId + "/" + business.id;
  const { data: previous, error: listError } = await admin.storage
    .from(BUCKET)
    .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (listError) throw new Error("GMB image storage is unavailable: " + listError.message);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = (previous || []).filter((file) => Date.parse(file.created_at || "") > cutoff);
  if (recent.length >= 12) throw new Error("Daily image limit reached (12 per business). Try again tomorrow.");

  const subject = postText.replace(/<[^>]*>/g, " ").replace(/https?:\/\/\S+/g, " ").slice(0, 700);
  const location = (business.address || "").slice(0, 150);
  const activity = (business.description || business.categories?.join(", ") || "").slice(0, 300);
  const prompt = [
    "Create ONE photorealistic horizontal 4:3 editorial photograph suitable for a Google Business Profile post.",
    "Business:", business.name.slice(0, 120),
    "Industry and services:", activity,
    "Location context:", location,
    "The post's real subject:", subject,
    "Editorial category:", postKind,
    "Illustrate concrete products or services that naturally fit this real business and post.",
    "Authentic professional photography, believable scale, clear main subject, natural light, beautiful composition.",
    "No invented discounts, fake products, fake proof, stock-photo watermarks, fabricated branding, text, typography,",
    "letters, prices, banners, coupons, QR codes, URLs, logos or overlays.",
    "Only a photo, never a flyer or ad graphic.",
  ].join(" ");

  const timeout = AbortSignal.timeout(75_000);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://googlereviewai.com",
      "X-Title": "GoogleReviewAI GMB image generator",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: prompt }],
    }),
    signal: timeout,
  });
  if (!response.ok) {
    const info = await response.text().catch(() => "");
    throw new Error("Image model error " + response.status + ": " + info.slice(0, 300));
  }
  const result = await response.json() as {
    choices?: { message?: {
      images?: { image_url?: { url?: string } }[];
    } }[];
    error?: { message?: string };
  };
  const imageDataUrl = result.choices?.[0]?.message?.images?.find(
    (item) => item.image_url?.url?.startsWith("data:image/"),
  )?.image_url?.url;
  if (!imageDataUrl) {
    throw new Error(result.error?.message || "OpenRouter returned no image. Please retry.");
  }
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imageDataUrl);
  if (!match) throw new Error("Unsupported image format from OpenRouter.");
  const mime = match[1] === "jpeg" ? "image/jpeg" : "image/" + match[1];
  const approxBytes = Math.floor(match[2].length * 0.75);
  if (approxBytes < 5000 || approxBytes > 10_000_000) throw new Error("Generated image has an invalid size.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const path = folder + "/" + crypto.randomUUID() + "." + extension;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, cacheControl: "31536000", upsert: false });
  if (uploadError) throw new Error("Unable to save generated photo: " + uploadError.message);
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl || !data.publicUrl.startsWith("https://")) {
    throw new Error("The generated photo has no public HTTPS URL.");
  }
  return data.publicUrl;
}
