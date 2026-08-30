import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet";
import { getSeoArticleBySlug, seoArticles } from "@/data/seoArticles";

const stripHtml = (html: string) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const staticArticle = getSeoArticleBySlug(slug);

  const { data: dynamicArticle, isLoading, error } = useQuery({
    queryKey: ["published-article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("published_articles")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug && !staticArticle,
  });

  if (staticArticle) {
    const canonical = `https://googlereviewai.com/blog/${staticArticle.slug}`;
    const related = staticArticle.relatedSlugs
      .map((relatedSlug) => seoArticles.find((item) => item.slug === relatedSlug))
      .filter(Boolean);

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: staticArticle.title,
      description: staticArticle.description,
      datePublished: staticArticle.publishedAt,
      dateModified: staticArticle.updatedAt,
      mainEntityOfPage: canonical,
      author: {
        "@type": "Organization",
        name: "Google Review AI",
        url: "https://googlereviewai.com",
      },
      publisher: {
        "@type": "Organization",
        name: "Google Review AI",
        url: "https://googlereviewai.com",
        logo: {
          "@type": "ImageObject",
          url: "https://googlereviewai.com/icon-512x512.png",
        },
      },
      keywords: staticArticle.keywords.join(", "),
    };

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: staticArticle.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://googlereviewai.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://googlereviewai.com/blog" },
        { "@type": "ListItem", position: 3, name: staticArticle.title, item: canonical },
      ],
    };

    return (
      <>
        <Helmet>
          <html lang="en" />
          <title>{staticArticle.title} | Google Review AI</title>
          <meta name="description" content={staticArticle.description} />
          <meta name="keywords" content={[staticArticle.targetKeyword, ...staticArticle.keywords].join(", ")} />
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
          <link rel="canonical" href={canonical} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={staticArticle.title} />
          <meta property="og:description" content={staticArticle.description} />
          <meta property="og:url" content={canonical} />
          <meta property="og:image" content="https://googlereviewai.com/og-image.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={staticArticle.title} />
          <meta name="twitter:description" content={staticArticle.description} />
          <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        </Helmet>

        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20">
            <div className="container mx-auto px-4 pt-8 max-w-4xl">
              <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to blog
              </Link>
            </div>

            <article className="container mx-auto px-4 py-8 max-w-4xl">
              <header className="border-b pb-8 mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <Badge>{staticArticle.category}</Badge>
                  <span className="text-sm text-muted-foreground">Target: {staticArticle.targetKeyword}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                  {staticArticle.title}
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-6">
                  {staticArticle.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" />Google Review AI Editorial Team</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Updated August 28, 2026</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{staticArticle.readTime} read</span>
                </div>
              </header>

              <div className="max-w-3xl mx-auto">
                <p className="text-lg leading-8 text-foreground/90 mb-10">{staticArticle.intro}</p>

                {staticArticle.sections.map((section) => (
                  <section key={section.heading} className="mb-10">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">{section.heading}</h2>
                    <div className="space-y-4 text-foreground/85 leading-8">
                      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    {section.bullets && (
                      <ul className="mt-5 space-y-3 list-disc pl-6 text-foreground/85 leading-7">
                        {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    )}
                  </section>
                ))}

                <section className="my-12 rounded-2xl border bg-muted/20 p-6 sm:p-8">
                  <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
                  <div className="space-y-6">
                    {staticArticle.faq.map((item) => (
                      <div key={item.question}>
                        <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                        <p className="text-muted-foreground leading-7">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="my-12">
                  <h2 className="text-2xl font-bold mb-5">Official sources</h2>
                  <div className="space-y-3">
                    {staticArticle.sources.map((source) => (
                      <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-primary hover:underline">
                        <ExternalLink className="w-4 h-4 mt-1 shrink-0" />
                        <span>{source.label}</span>
                      </a>
                    ))}
                  </div>
                </section>

                {related.length > 0 && (
                  <section className="my-12 border-t pt-10">
                    <h2 className="text-2xl font-bold mb-6">Related guides</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {related.map((item) => item && (
                        <Link key={item.slug} to={`/blog/${item.slug}`} className="group rounded-xl border p-5 hover:bg-muted/30 transition-colors">
                          <Badge variant="secondary" className="mb-3">{item.category}</Badge>
                          <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
                          <span className="mt-4 inline-flex items-center text-sm text-primary">Read guide <ArrowRight className="w-4 h-4 ml-1" /></span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </article>

            <section className="py-12 bg-muted/30">
              <div className="container mx-auto px-4 text-center max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Turn review management into a repeatable system</h2>
                <p className="text-muted-foreground mb-6">Use Google Review AI to organize review replies, local visibility and reputation workflows from one place.</p>
                <Button asChild size="lg"><Link to="/auth">Start free</Link></Button>
              </div>
            </section>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-64 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !dynamicArticle) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
            <h1 className="text-2xl font-bold mb-4">Article not found</h1>
            <p className="text-muted-foreground mb-6">The article you are looking for does not exist or has been removed.</p>
            <Button asChild><Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Back to blog</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const publishedDate = new Date(dynamicArticle.published_at).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const readingTime = Math.ceil(stripHtml(dynamicArticle.body).split(/\s+/).length / 200);
  const dynamicDescription = dynamicArticle.meta_description || `${stripHtml(dynamicArticle.body).slice(0, 157)}…`;
  const dynamicCanonical = `https://googlereviewai.com/blog/${dynamicArticle.slug}`;

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{dynamicArticle.title} | Google Review AI Blog</title>
        <meta name="description" content={dynamicDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={dynamicCanonical} />
        <meta property="og:title" content={dynamicArticle.title} />
        <meta property="og:description" content={dynamicDescription} />
        <meta property="og:url" content={dynamicCanonical} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://googlereviewai.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: dynamicArticle.title,
          description: dynamicDescription,
          datePublished: dynamicArticle.published_at,
          dateModified: dynamicArticle.updated_at,
          mainEntityOfPage: dynamicCanonical,
          author: { "@type": "Organization", name: dynamicArticle.author || "Google Review AI" },
          publisher: { "@type": "Organization", name: "Google Review AI", url: "https://googlereviewai.com" },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4 mr-2" />Back to blog</Link>
          </div>
          <header className="container mx-auto px-4 pb-8 max-w-4xl">
            <Badge className="mb-4">Article</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">{dynamicArticle.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{dynamicArticle.author || "Google Review AI Team"}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{publishedDate}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{readingTime} min read</span>
            </div>
          </header>
          <article className="container mx-auto px-4 pb-16 max-w-3xl">
            <div className="magazine-article prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: dynamicArticle.body }} />
          </article>
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 text-center max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Ready to improve your local visibility?</h2>
              <p className="text-muted-foreground mb-6">Use Google Review AI to manage reviews and strengthen your local presence.</p>
              <Button asChild size="lg"><Link to="/auth">Start free</Link></Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogArticle;
