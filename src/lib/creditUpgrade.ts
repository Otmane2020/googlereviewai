import { isActivePaidPlan, type PlanProfile } from "./planEntitlements";

/** A loaded, exhausted free balance prompts an upgrade, never a dashboard lock. */
export function shouldPromptCreditUpgrade(input: {
  ready: boolean;
  profile: PlanProfile | null;
  credits: number;
  agencyCredits: number;
  businessCredits: number;
}): boolean {
  return input.ready && !isActivePaidPlan(input.profile)
    && Math.max(0, input.credits) + Math.max(0, input.agencyCredits)
      + Math.max(0, input.businessCredits) === 0;
}