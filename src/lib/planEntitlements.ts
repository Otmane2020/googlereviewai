/**
 * Centralized display and access rules for the primary GoogleReviewAI plan.
 * The plan name alone NEVER grants paid access: Stripe webhook status must
 * report active (or a non-expired legacy trial).
 */
export type PlanTier = "free" | "starter" | "pro" | "business";

export interface PlanProfile {
  plan_name?: string | null;
  plan_id?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  trial_end?: string | null;
  max_businesses?: number | null;
}

export const normalizePlanTier = (name?: string | null): PlanTier => {
  const n = (name || "").toLowerCase();
  if (n.includes("business") || n.includes("agence") || n.includes("agency")) return "business";
  if (n.includes("pro") || n.includes("quotidien") || n.includes("growth") || n.includes("daily")) return "pro";
  if (n.includes("starter")) return "starter";
  return "free";
};

export const isActivePaidPlan = (profile?: PlanProfile | null): boolean => {
  if (!profile || normalizePlanTier(profile.plan_name) === "free") return false;
  const status = (profile.subscription_status || "").toLowerCase();
  if (!["active", "trial", "trialing"].includes(status)) return false;
  const trialEnd = profile.trial_end ? Date.parse(profile.trial_end) : NaN;
  if ((status === "trial" || status === "trialing") && (!Number.isFinite(trialEnd) || trialEnd <= Date.now())) return false;
  const periodEnd = profile.current_period_end ? Date.parse(profile.current_period_end) : NaN;
  if (Number.isFinite(periodEnd) && periodEnd <= Date.now()) return false;
  return true;
};

export const effectivePlanTier = (profile?: PlanProfile | null): PlanTier =>
  isActivePaidPlan(profile) ? normalizePlanTier(profile?.plan_name) : "free";

export const managedLocationLimit = (profile?: PlanProfile | null): number => {
  const tier = effectivePlanTier(profile);
  // Free access may include complimentary credits; only one managed location.
  if (tier === "business") return 999;
  if (tier === "pro") return 3;
  return 1;
};

export const includesPremiumModules = (profile?: PlanProfile | null): boolean =>
  ["pro", "business"].includes(effectivePlanTier(profile));

export const isCurrentModuleSubscription = (row: { status?: string | null; current_period_end?: string | null }) =>
  row.status === "active" &&
  Boolean(row.current_period_end) &&
  Number.isFinite(Date.parse(row.current_period_end!)) &&
  Date.parse(row.current_period_end!) > Date.now();
