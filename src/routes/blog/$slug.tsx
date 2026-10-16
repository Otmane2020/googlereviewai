import { createFileRoute } from "@tanstack/react-router";
import BlogArticle from "@/pages/BlogArticle";
import { getSeoArticleBySlug } from "@/data/seoArticles";
import { jsonLd, REVIEWSAI_ORIGIN } from "@/lib/marketingSeo";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const article = getSeoArticleBySlug(params.slug);
    // Only emit article claims for content that we actually have in the repo.
    // Dynamic database articles provide their own metadata in BlogArticle.
    if (!article) return {};
    const url = REVIEWSAI_ORIGIN + "/blog/" + article.slug;
    const lang = article.slug.endsWith("-fr") ? "fr" : "en";
    const links: Array<{ rel: string; href: string; hrefLang?: string }> = [{ rel: "canonical", href: url }];
    if (article.category.includes("GEO &")) {
      const base = article.slug.replace(/-fr$/, "");
      links.push(
        { rel: "alternate", hrefLang: "en", href: REVIEWSAI_ORIGIN + "/blog/" + base },
        { rel: "alternate", hrefLang: "fr", href: REVIEWSAI_ORIGIN + "/blog/" + base + "-fr" },
        { rel: "alternate", hrefLang: "x-default", href: REVIEWSAI_ORIGIN + "/blog/" + base },
      );
    }
    const articleText = [article.intro, article.quickAnswer,
      ...(article.keyTakeaways || []),
      ...article.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.bullets || [])]),
    ].filter(Boolean).join(" ");

    return {
      meta: [
        { title: article.title + " | ReviewsAI" },
        { name: "description", content: article.description },
        { name: "robots", content: "index,follow,max-image-preview:large" },
        { property: "og:type", content: "article" },
        { property: "og:title", content: article.title },
        { property: "og:description", content: article.description },
        { property: "og:url", content: url },
        { property: "og:image", content: REVIEWSAI_ORIGIN + "/og-image.png" },
        { property: "article:published_time", content: article.publishedAt },
        { property: "article:modified_time", content: article.updatedAt },
      ],
      links,
      scripts: [{
        type: "application/ld+json",
        children: jsonLd({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "@id": url + "#article",
              headline: article.title,
              description: article.description,
              inLanguage: lang,
              datePublished: article.publishedAt,
              dateModified: article.updatedAt,
              mainEntityOfPage: { "@type": "WebPage", "@id": url },
              wordCount: articleText.trim().split(/\s+/).filter(Boolean).length,
              author: { "@type": "Organization", name: "ReviewsAI", url: REVIEWSAI_ORIGIN + "/" },
              publisher: { "@id": REVIEWSAI_ORIGIN + "/#organization" },
              isPartOf: { "@id": REVIEWSAI_ORIGIN + "/#website" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: REVIEWSAI_ORIGIN + "/" },
                { "@type": "ListItem", position: 2, name: "Guides", item: REVIEWSAI_ORIGIN + "/blog" },
                { "@type": "ListItem", position: 3, name: article.title, item: url },
              ],
            },
          ],
        }),
      }],
    };
  },
  component: BlogArticle,
});
