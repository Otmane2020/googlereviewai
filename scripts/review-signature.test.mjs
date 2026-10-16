import { test, expect } from "bun:test";
import {
  shortReviewBrandName,
  defaultReviewSignature,
  resolveReviewSignature,
  ensureReviewSignature,
  detectReviewSignatureChoice,
  buildReviewSignatureChoice,
} from "../supabase/functions/_shared/review-signature.ts";

test("removes commercial descriptors but retains the real brand", () => {
  expect(shortReviewBrandName("Sweet Deco - Grossiste de Meubles")).toBe("Sweet Deco");
  expect(shortReviewBrandName("Sweet Deco grossiste de meubles")).toBe("Sweet Deco");
  expect(shortReviewBrandName("Sweet Deco : Vente en gros de mobilier")).toBe("Sweet Deco");
  expect(shortReviewBrandName("The Coffee Shop")).toBe("The Coffee Shop");
});

test("uses concise team signatures in the review language", () => {
  expect(defaultReviewSignature("Sweet Deco - Grossiste de Meubles", "fr")).toBe("— L'équipe Sweet Deco");
  expect(defaultReviewSignature("Sweet Deco - Furniture Wholesaler", "en")).toBe("— The Sweet Deco team");
  expect(defaultReviewSignature("Notre établissement", "fr")).toBe("— L'équipe");
  expect(defaultReviewSignature("Our establishment", "en")).toBe("— The team");
});

test("old onboarding personal name and old default template become a brand signature", () => {
  expect(resolveReviewSignature({
    configuredSignature: "L'équipe Ben Test", legacyAccountFullName: "Ben Test",
    businessName: "Sweet Deco - Grossiste de Meubles", language: "fr",
  })).toBe("— L'équipe Sweet Deco");
  expect(resolveReviewSignature({
    configuredSignature: "The {business_name} team",
    businessName: "Sweet Deco - Grossiste de Meubles", language: "fr",
  })).toBe("— L'équipe Sweet Deco");
});

test("does not override custom sign-offs or disabled signatures", () => {
  expect(resolveReviewSignature({
    configuredSignature: "Bien cordialement, {business_name}",
    businessName: "Sweet Deco - Grossiste de Meubles", language: "fr",
  })).toBe("Bien cordialement, Sweet Deco");
  expect(resolveReviewSignature({
    configuredSignature: "La direction",
    businessName: "Sweet Deco - Grossiste de Meubles", language: "fr",
  })).toBe("La direction");
  expect(resolveReviewSignature({
    configuredSignature: "La direction", includeSignature: false,
    businessName: "Sweet Deco", language: "fr",
  })).toBe("");
});

test("the model cannot append a verbose duplicate team signature", () => {
  expect(ensureReviewSignature(
    "Merci beaucoup pour votre avis.\n\n— L'équipe Sweet Deco - Grossiste de Meubles",
    "— L'équipe Sweet Deco",
  )).toBe("Merci beaucoup pour votre avis.\n\n— L'équipe Sweet Deco");
  expect(ensureReviewSignature(
    "Merci beaucoup.\n\n— L'équipe Sweet Deco", "— L'équipe Sweet Deco",
  )).toBe("Merci beaucoup.\n\n— L'équipe Sweet Deco");
});

test("smart Google brand signature is the default onboarding choice", () => {
  const detected = detectReviewSignatureChoice(null, true, "Someone");
  expect(detected.mode).toBe("automatic");
  const chosen = buildReviewSignatureChoice(detected, "fr");
  expect(chosen).toEqual({ signature: "L'équipe {business_name}", include_signature: true });
  expect(resolveReviewSignature({
    businessName: "Sweet Deco - Grossiste de Meubles", language: "fr",
    configuredSignature: chosen.signature, includeSignature: chosen.include_signature,
  })).toBe("— L'équipe Sweet Deco");

  expect(buildReviewSignatureChoice(detected, "en").signature).toBe("The {business_name} team");
});

test("brand-only signatures resolve to the short listing name", () => {
  const choice = buildReviewSignatureChoice({ mode: "business_only", name: "", custom: "" }, "en");
  expect(resolveReviewSignature({
    businessName: "Sweet Deco - Grossiste de Meubles",
    language: "en", configuredSignature: choice.signature,
  })).toBe("Sweet Deco");
});

test("chosen team name is saved, restored, and used in the generated reply", () => {
  const choice = { mode: "named_team", name: "  Decora Home  ", custom: "" };
  const saved = buildReviewSignatureChoice(choice, "fr");
  expect(saved.signature).toBe("L'équipe Decora Home");
  expect(detectReviewSignatureChoice(saved.signature).mode).toBe("named_team");
  expect(detectReviewSignatureChoice(saved.signature).name).toBe("Decora Home");
  expect(resolveReviewSignature({
    businessName: "Sweet Deco - Grossiste de Meubles",
    language: "fr", configuredSignature: saved.signature,
  })).toBe("L'équipe Decora Home");
});

test("personalized and disabled signatures survive onboarding reload", () => {
  const custom = buildReviewSignatureChoice(
    { mode: "custom", name: "", custom: " Bien cordialement, la direction " }, "fr",
  );
  expect(custom.signature).toBe("Bien cordialement, la direction");
  expect(detectReviewSignatureChoice(custom.signature).mode).toBe("custom");
  const none = buildReviewSignatureChoice({ mode: "none", name: "", custom: "" }, "fr");
  expect(none.include_signature).toBe(false);
  expect(detectReviewSignatureChoice(none.signature, none.include_signature).mode).toBe("none");
  expect(detectReviewSignatureChoice("L'équipe Ben", true, "Ben").mode).toBe("automatic");
});

test("cannot save a custom signature without the required name or text", () => {
  expect(() => buildReviewSignatureChoice({ mode: "named_team", name: "  ", custom: "" }, "fr")).toThrow();
  expect(() => buildReviewSignatureChoice({ mode: "custom", name: "", custom: " " }, "en")).toThrow();
});
