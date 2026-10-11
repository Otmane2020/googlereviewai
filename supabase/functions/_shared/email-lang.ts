// Source of truth for business-related email language:
// explicitly configured business GMB language > per-send language > account language.
// A Google Business location may be addressed by its local UUID or Google place ID.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type Lang = "fr" | "en";

const normalize = (value?: string | null): Lang | null => {
  const lang = value?.trim().toLowerCase();
  if (lang === "en" || lang?.startsWith("en-") || lang?.startsWith("en_")) return "en";
  if (lang === "fr" || lang?.startsWith("fr-") || lang?.startsWith("fr_")) return "fr";
  return null;
};

export async function resolveEmailLang(
  email?: string | null,
  explicit?: string | null,
  userId?: string | null,
  businessId?: string | null,
): Promise<Lang> {
  const requestedLanguage = normalize(explicit);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return requestedLanguage || "en";

    const supa = createClient(supabaseUrl, serviceKey);
    let profileQuery = supa.from("profiles").select("id, preferred_language");
    if (userId) profileQuery = profileQuery.eq("id", userId);
    else if (email) profileQuery = profileQuery.eq("email", email);
    else return requestedLanguage || "en";

    const { data: profile, error: profileError } = await profileQuery.maybeSingle();
    if (profileError || !profile) return requestedLanguage || "en";

    let businessLanguage: Lang | null = null;
    if (businessId) {
      const googlePlaceId = businessId.split("/").pop() || businessId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);
      const query = supa.from("businesses")
        .select("gmb_language").eq("user_id", profile.id);
      const { data } = await (isUuid ? query.eq("id", businessId) : query.eq("google_place_id", googlePlaceId)).maybeSingle();
      businessLanguage = normalize(data?.gmb_language);
    } else {
      // Global account emails only follow GMB language if all active locations
      // with a configured language agree; for mixed accounts use the account setting.
      const { data: businesses } = await supa.from("businesses")
        .select("gmb_language").eq("user_id", profile.id).eq("is_active", true).limit(100);
      const configured = (businesses || []).map((b) => normalize(b.gmb_language)).filter((v): v is Lang => v !== null);
      if (configured.length > 0 && configured.every((v) => v === configured[0])) {
        businessLanguage = configured[0];
      }
    }

    return businessLanguage || requestedLanguage || normalize(profile.preferred_language) || "en";
  } catch (error) {
    console.warn("[email-lang] Could not resolve GMB language; using fallback", error);
    return requestedLanguage || "en";
  }
}
