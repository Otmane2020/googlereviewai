import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateGmbImageBytes } from "./gmbImageProviders.ts";

const BUCKET = "gmb-generated-images";

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

  // Cloudflare Workers AI (when configured) generates the image. OpenRouter
  // remains a fallback. Both return validated binary bytes, never a model URL.
  const generated = await generateGmbImageBytes(prompt);
  const path = folder + "/" + crypto.randomUUID() + "." + generated.extension;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, generated.bytes, { contentType: generated.mime, cacheControl: "31536000", upsert: false });
  if (uploadError) throw new Error("Unable to save generated photo: " + uploadError.message);
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl || !data.publicUrl.startsWith("https://")) {
    throw new Error("The generated photo has no public HTTPS URL.");
  }
  console.log("[GMB images] Generated and saved with provider", generated.provider, "business", business.id);
  return data.publicUrl;
}
