import { createFileRoute } from "@tanstack/react-router";
import BlogArticle from "@/pages/BlogArticle";
import { getSeoArticleBySlug } from "@/data/seoArticles";
import { getPublishedRankiArticle } from "@/integrations/supabase/rankiBlogClient";

export const Route = createFileRoute("/blog/$slug")({
  ssr: true,
  loader: async ({ params }) => {
    const staticArticle = getSeoArticleBySlug(params.slug);
    if (staticArticle) {
      return { staticArticle, rankiArticle: null };
    }

    try {
      const rankiArticle = await getPublishedRankiArticle(params.slug);
      return { staticArticle: null, rankiArticle };
    } catch (error) {
      console.error("[blog loader] unable to load Ranki article", error);
      return { staticArticle: null, rankiArticle: null };
    }
  },
  head: ({ loaderData, params }) => {
    const staticArticle = loaderData?.staticArticle;
    const rankiArticle = loaderData?.rankiArticle;
    const canonical = `https://googlereviewai.com/blog/${params.slug}`;

    const title = staticArticle
      ? `${staticArticle.title} | Google Review AI`
      : rankiArticle
        ? `${rankiArticle.title} | Google Review AI Blog`
        : "Article | Google Review AI";

    const description = staticArticle?.description
      || rankiArticle?.excerpt
      || "Google Review AI article about review management, local SEO and AI search visibility.";

    const image = rankiArticle?.cover_url || "https://googlereviewai.com/og-image.png";
    const keywords = staticArticle
      ? [staticArticle.targetKeyword, ...staticArticle.keywords].join(", ")
      : (rankiArticle?.keywords || []).join(", ");

    const articleSchema = rankiArticle ? {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: rankiArticle.title,
      description,
      image: rankiArticle.cover_url || undefined,
      datePublished: rankiArticle.published_at || rankiArticle.created_at,
      dateModified: rankiArticle.updated_at || rankiArticle.published_at || rankiArticle.created_at,
      mainEntityOfPage: canonical,
      keywords: rankiArticle.keywords || [],
      author: {
        "@type": "Organization",
        name: "Google Review AI",
        url: "https://googlereviewai.com/",
      },
      publisher: {
        "@type": "Organization",
        name: "Google Review AI",
        url: "https://googlereviewai.com/",
        logo: {
          "@type": "ImageObject",
          url: "https://googlereviewai.com/icon-512x512.png",
        },
      },
    } : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        { name: "robots", content: rankiArticle || staticArticle ? "index, follow, max-snippet:-1, max-image-preview:large" : "noindex, nofollow" },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: articleSchema ? [{
        type: "application/ld+json",
        children: JSON.stringify(articleSchema),
      }] : [],
    };
  },
  component: BlogArticleRoute,
});

function BlogArticleRoute() {
  const data = Route.useLoaderData();
  return <BlogArticle initialRankiArticle={data?.rankiArticle ?? null} />;
}
