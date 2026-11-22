import { expect, test } from "bun:test";
import { classifyConsentError } from "../src/lib/oauth-consent-error.ts";

test("an expired or consumed authorization request cannot be retried", () => {
  expect(classifyConsentError({ code: "oauth_authorization_not_found", status: 404, message: "authorization not found" })).toBe("expired");
  expect(classifyConsentError({ status: 404 })).toBe("expired");
  expect(classifyConsentError({ message: "Authorization expired" })).toBe("expired");
});

test("a lost login sends the user back to sign in", () => {
  expect(classifyConsentError({ code: "session_not_found", status: 403 })).toBe("session");
  expect(classifyConsentError({ status: 401, message: "invalid JWT" })).toBe("session");
});

test("network or unknown failures stay retryable", () => {
  expect(classifyConsentError(new TypeError("Failed to fetch"))).toBe("retry");
  expect(classifyConsentError(undefined)).toBe("retry");
});
