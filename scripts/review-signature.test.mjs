import { test, expect } from "bun:test";
import {
  shortReviewBrandName,
  defaultReviewSignature,
  resolveReviewSignature,
  ensureReviewSignature,
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
