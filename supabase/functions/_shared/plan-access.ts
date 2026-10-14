export interface PlanRecord {
  plan_name?: string | null;
  plan_id?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  trial_end?: string | null;
  max_businesses?: number | null;
}

export function activePlanTier(p?: PlanRecord | null): "free" | "starter" | "pro" | "business" {
  if (!p) return "free";
  const status = (p.subscription_status || "").toLowerCase();
  if (!["active", "trial", "trialing"].includes(status)) return "free";
  if (["trial", "trialing"].includes(status)) {
    const trialEnd = p.trial_end ? Date.parse(p.trial_end) : NaN;
    if (!Number.isFinite(trialEnd) || trialEnd <= Date.now()) return "free";
  }
  if (p.current_period_end) {
    const periodEnd = Date.parse(p.current_period_end);
    if (Number.isFinite(periodEnd) && periodEnd <= Date.now()) return "free";
  }
  const n = (p.plan_name || "").toLowerCase();
  if (n.includes("business") || n.includes("agence") || n.includes("agency")) return "business";
  if (n.includes("pro") || n.includes("quotidien") || n.includes("daily") || n.includes("growth")) return "pro";
  if (n.includes("starter")) return "starter";
  return "free";
}

export function managedLocationLimit(p?: PlanRecord | null): number {
  const tier = activePlanTier(p);
  return tier === "business" ? 999 : tier === "pro" ? 3 : 1;
}

export function hasUnlimitedAiReplies(p?: PlanRecord | null): boolean {
  return ["pro", "business"].includes(activePlanTier(p));
}


/** Grandfather valid legacy SEO add-ons while rejecting expired "active" rows. */
export async function hasSeoAutomationAccess(
  admin: any, userId: string, profile?: PlanRecord | null,
): Promise<boolean> {
  if (["pro", "business"].includes(activePlanTier(profile))) return true;
  const { data, error } = await admin.from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("module", "seo_autopost")
    .eq("status", "active")
    .gt("current_period_end", new Date().toISOString())
    .limit(1);
  return !error && Boolean(data?.length);
}
