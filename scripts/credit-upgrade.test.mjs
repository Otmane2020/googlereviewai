import { test, expect } from "bun:test";
import { shouldPromptCreditUpgrade } from "../src/lib/creditUpgrade.ts";

const free = { ready: true, profile: { plan_name: "free" }, credits: 3, agencyCredits: 0, businessCredits: 0 };

test("the three free credits can be used before an upgrade is proposed", () => {
  for (const credits of [3, 2, 1]) expect(shouldPromptCreditUpgrade({ ...free, credits })).toBe(false);
  expect(shouldPromptCreditUpgrade({ ...free, credits: 0 })).toBe(true);
});

test("a balance that has not loaded must not trigger an upgrade", () => {
  expect(shouldPromptCreditUpgrade({ ...free, ready: false, credits: 0 })).toBe(false);
});

test("active paying customers are not treated as exhausted free accounts", () => {
  for (const plan_name of ["starter", "pro", "business"]) {
    expect(shouldPromptCreditUpgrade({ ...free, credits: 0, profile: {
      plan_name, subscription_status: "active", current_period_end: "2099-01-01T00:00:00Z",
    } })).toBe(false);
  }
});

test("available business or agency credits postpone the upgrade prompt", () => {
  expect(shouldPromptCreditUpgrade({ ...free, credits: 0, businessCredits: 1 })).toBe(false);
  expect(shouldPromptCreditUpgrade({ ...free, credits: 0, agencyCredits: 1 })).toBe(false);
});