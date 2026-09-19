import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ARTICLE_FILES = [
  "src/data/articles/geoAeoArticles.ts",
  "src/data/articles/localSeoArticles.ts",
  "src/data/articles/reviewArticles.ts",
  "src/data/articles/industryArticles.ts",
];

const EXPECTED_ARTICLES = 20;
const MIN_WORDS = 2000;

function extractArticles(source, file) {
  const chunks = source.split(/\n\s{2}\{\n\s{4}slug:/).slice(1);

  return chunks.map((chunk) => {
    const slugMatch = chunk.match(/^\s*"([^"]+)"/);
    if (!slugMatch) {
      throw new Error("Could not parse article slug in " + file);
    }

    const introStart = chunk.indexOf("intro:");
    const relatedStart = chunk.indexOf("relatedSlugs:");

    if (introStart < 0 || relatedStart < 0 || relatedStart <= introStart) {
      throw new Error("Could not isolate visible article content for " + slugMatch[1] + " in " + file);
    }

    const visibleRegion = chunk.slice(introStart, relatedStart);
    const strings = [...visibleRegion.matchAll(/"((?:\\.|[^"\\])*)"/gs)]
      .map((match) => match[1].replace(/\\./g, " "));

    const wordCount = strings
      .join(" ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return { slug: slugMatch[1], wordCount, file };
  });
}

const articles = ARTICLE_FILES.flatMap((relativeFile) => {
  const absoluteFile = path.join(ROOT, relativeFile);
  if (!fs.existsSync(absoluteFile)) {
    throw new Error("Missing article source file: " + relativeFile);
  }
  return extractArticles(fs.readFileSync(absoluteFile, "utf8"), relativeFile);
});

const slugs = articles.map((article) => article.slug);
const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
const tooShort = articles.filter((article) => article.wordCount < MIN_WORDS);

console.log("\nSEO article length validation");
console.log("========================================");
for (const article of articles) {
  console.log(String(article.wordCount).padStart(4) + " words  " + article.slug);
}
console.log("========================================");
console.log(articles.length + "/" + EXPECTED_ARTICLES + " articles found");
console.log("Minimum word count: " + Math.min(...articles.map((article) => article.wordCount)));

const errors = [];

if (articles.length !== EXPECTED_ARTICLES) {
  errors.push("Expected exactly " + EXPECTED_ARTICLES + " long-form articles, found " + articles.length + ".");
}

if (duplicateSlugs.length > 0) {
  errors.push("Duplicate slugs found: " + [...new Set(duplicateSlugs)].join(", "));
}

if (tooShort.length > 0) {
  errors.push("Articles below " + MIN_WORDS + " words:\n" + tooShort.map((article) => "- " + article.slug + ": " + article.wordCount).join("\n"));
}

if (errors.length > 0) {
  console.error("\nValidation failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("\nValidation passed: " + articles.length + "/" + EXPECTED_ARTICLES + " articles are at least " + MIN_WORDS + " words.");
