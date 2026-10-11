/**
 * Send the one-time free-tier upgrade email on reaching 0 credits.
 * A database-level claim prevents duplicate sends across manual/cron workers.
 * Only invoke with the service-role Supabase client (the claim RPC is private).
 */
export async function sendFreeUpgradeEmail(
  supabase: any,
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<void> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, full_name, preferred_language, credits, plan_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.email || profile.credits !== 0) return;
  if (profile.plan_name && !["", "free"].includes(profile.plan_name.trim().toLowerCase())) return;

  const { data: claimed, error: claimError } = await supabase
    .rpc("claim_free_upgrade_email", { p_user_id: userId });
  if (claimError) {
    console.error("[FreeUpgrade] Could not claim email:", claimError);
    return;
  }
  if (!claimed) return;

  try {
    const result = await fetch(`${supabaseUrl}/functions/v1/send-engagement-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        email: profile.email,
        name: profile.full_name || "",
        type: "free_limit_upgrade",
        lang: profile.preferred_language === "en" ? "en" : "fr",
        user_id: userId,
      }),
    });
    const data = await result.json().catch(() => ({}));
    if (!result.ok || data.success !== true) {
      throw new Error(`Resend upgrade email failed (HTTP ${result.status})`);
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "free_credits_exhausted",
      title: profile.preferred_language === "en" ? "Your free AI replies are used" : "Vos 3 réponses IA gratuites sont utilisées",
      message: profile.preferred_language === "en"
        ? "Choose a plan to continue generating AI replies."
        : "Choisissez un abonnement pour continuer à générer des réponses IA.",
    });
  } catch (error) {
    // Allow retry after transient failure. No email is counted as sent here.
    console.error("[FreeUpgrade] Delivery failed:", error);
    await supabase.from("profiles")
      .update({ free_upgrade_email_claimed_at: null })
      .eq("id", userId);
  }
}
