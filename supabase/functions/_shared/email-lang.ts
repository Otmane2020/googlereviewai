// Shared email language resolver
// Priority: explicit body lang > profiles.preferred_language > "en"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type Lang = "fr" | "en";

export async function resolveEmailLang(
  email?: string | null,
  explicit?: string | null,
  userId?: string | null,
): Promise<Lang> {
  if (explicit === "en" || explicit === "fr") return explicit;
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    let q = supa.from("profiles").select("preferred_language").limit(1);
    if (userId) q = q.eq("id", userId) as any;
    else if (email) q = q.eq("email", email) as any;
    else return "en";
    const { data } = await q.maybeSingle();
    const pl = (data as any)?.preferred_language;
    if (pl === "fr") return "fr";
    if (pl === "en") return "en";
  } catch (_) { /* fall through */ }
  return "en";
}
