import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const sitemap = read("public/sitemap.xml");
const robots = read("public/robots.txt");
const llms = read("public/llms.txt");
const home = read("src/routes/index.tsx");
const blog = read("src/routes/blog/index.tsx");
const blogArticle = read("src/routes/blog/$slug.tsx");
const brand = read("src/lib/marketingSeo.ts");
const frRoute = read("src/routes/reponse-avis-google-ia-gratuit.tsx");
const landing = read("src/components/launch/ProductHuntLanding.tsx");

test("public sitemap uses the right domain and has no duplicate URLs", () => {
  expect(sitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  expect(locs.length).toBeGreaterThan(20);
  expect(new Set(locs).size).toBe(locs.length);
  expect(locs.every(url => url.startsWith("https://reviewsai.store/"))).toBe(true);
  expect(locs).toContain("https://reviewsai.store/reponse-avis-google-ia-gratuit");
  expect(locs).toContain("https://reviewsai.store/ai-google-review-reply");
  expect(locs).toContain("https://reviewsai.store/blog");
  expect(sitemap.endsWith("</urlset>")).toBe(true);
});

test("old-domain marketing canonical links have been replaced", () => {
  for (const name of [
    "ai-google-review-reply", "ai-review-reply-generator",
    "google-review-response-generator", "google-review-management",
    "google-business-review-replies", "review-management-software",
  ]) {
    const route = read(`src/routes/${name}.tsx`);
    expect(route).toContain("https://reviewsai.store/" + name);
    expect(route).not.toContain("https://googlereviewai.com");
  }
});

test("server-rendered home, blog and French landing have indexable canonicals", () => {
  for (const source of [home, blog, blogArticle, frRoute]) {
    expect(source).toContain("head:");
    expect(source).toContain('"canonical"');
    expect(source).toContain('"application/ld+json"');
  }
  expect(brand).toContain('"SoftwareApplication"');
  expect(brand).toContain("3 complimentary AI review reply credits");
  expect(brand).not.toContain('"AggregateRating"');
  expect(frRoute).toContain('"fr"');
});

test("home links to real acquisition and help pages", () => {
  for (const path of [
    "/google-review-response-generator",
    "/google-review-management",
    "/blog/negative-google-review-response-examples",
    "/blog/google-business-profile-optimization-checklist",
    "/reponse-avis-google-ia-gratuit",
  ]) expect(landing).toContain(path);
  expect(landing).toContain("Démonstration");
});

test("robots and LLM discovery agree on production brand", () => {
  expect(robots).toContain("Sitemap: https://reviewsai.store/sitemap.xml");
  expect(robots).toContain("Disallow: /dashboard");
  expect(llms).toContain("# ReviewsAI");
  expect(llms).toContain("3 AI-generated reply credits");
  expect(llms).toContain("https://reviewsai.store/reponse-avis-google-ia-gratuit");
  expect(llms).not.toContain("Ranki.ai publishing feed");
});
