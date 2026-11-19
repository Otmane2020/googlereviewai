import { expect, test } from "bun:test";
import { isAgentConsentReturn, oauthReturnPath } from "../src/lib/oauth-return-path.ts";

test("Google sign-in can return to the full ReviewsAI agent consent URL", () => {
  const next = "/.lovable/oauth/consent?authorization_id=request%2Babc#resume";
  const query = new URLSearchParams({ next }).toString();
  const path = oauthReturnPath(new URLSearchParams(query).get("next"));
  expect(path).toBe(next);
  expect(isAgentConsentReturn(path)).toBe(true);
  expect(isAgentConsentReturn("/onboarding")).toBe(false);
});

test("consent returns must stay on this app's origin", () => {
  for (const path of ["//outside.invalid", "/\\outside.invalid", "/a/..//outside.invalid", "/\n/outside.invalid", "https://outside.invalid"]) {
    expect(oauthReturnPath(path)).toBe("/");
  }
});
