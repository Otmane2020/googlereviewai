import { test, expect } from "bun:test";
import {
  originalGoogleReviewText, reviewOriginalLanguage, gmbContentLanguage,
  normalizeContentLanguage, googlePostLanguageCode, languageLabel,
} from "../supabase/functions/_shared/content-language.ts";
import { defaultReviewSignature, resolveReviewSignature } from "../supabase/functions/_shared/review-signature.ts";

test("removes only the Google translation, not the author's original French review", () => {
  const input = "La table est magnifique\n\n(Translated by Google)\nThe table is magnificent";
  expect(originalGoogleReviewText(input)).toBe("La table est magnifique");
  expect(reviewOriginalLanguage(input, "en")).toBe("fr");
  expect(resolveReviewSignature({
    configuredSignature: "The {business_name} team", businessName: "Sweet Deco - Grossiste de Meubles",
    language: reviewOriginalLanguage(input, "en"),
  })).toBe("— L'équipe Sweet Deco");
});

test("English review takes precedence over French business / account", () => {
  const input = "Great service and helpful team. Fast delivery, thank you!";
  expect(reviewOriginalLanguage(input, "fr")).toBe("en");
  expect(defaultReviewSignature("Sweet Deco - Grossiste de Meubles", reviewOriginalLanguage(input, "fr")))
    .toBe("— The Sweet Deco team");
});

test("French short review is not translated because GMB has English locale", () => {
  expect(reviewOriginalLanguage("Magnifique meuble TV bonne qualité, je recommande vraiment !", "en")).toBe("fr");
  expect(reviewOriginalLanguage("La table est magnifique", "en")).toBe("fr");
  expect(reviewOriginalLanguage("Service impeccable, livraison très rapide", "en")).toBe("fr");
});

test("Spanish, German and non-Latin scripts are respected", () => {
  expect(reviewOriginalLanguage("Muchas gracias, muy buena atención", "en")).toBe("es");
  expect(reviewOriginalLanguage("Sehr freundlich und schnell, danke!", "fr")).toBe("de");
  expect(reviewOriginalLanguage("خدمة ممتازة شكرا جزيلا", "en")).toBe("ar");
  expect(reviewOriginalLanguage("とても良かったです！", "fr")).toBe("ja");
  expect(defaultReviewSignature("Sweet Deco", "es")).toBe("— El equipo de Sweet Deco");
  expect(defaultReviewSignature("Sweet Deco", "de")).toBe("— Das Team von Sweet Deco");
});

test("a star-only review falls back to the location's GMB language", () => {
  expect(reviewOriginalLanguage(null, "en-GB")).toBe("en");
  expect(reviewOriginalLanguage("", "fr-FR")).toBe("fr");
});

test("SEO GEO always follows the selected Google location, including regional locale", () => {
  expect(gmbContentLanguage("en-CA", "fr")).toBe("en");
  expect(gmbContentLanguage("fr-FR", "en")).toBe("fr");
  expect(gmbContentLanguage("es-ES", "en")).toBe("es");
  expect(normalizeContentLanguage("EN_us")).toBe("en");
  expect(googlePostLanguageCode("en-CA")).toBe("en-CA");
  expect(googlePostLanguageCode("fr")).toBe("fr-FR");
  expect(googlePostLanguageCode("es")).toBe("es-ES");
  expect(languageLabel("pt-BR")).toBe("Portuguese");
});
