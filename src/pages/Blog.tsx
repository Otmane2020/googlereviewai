import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChefHat,
  Hotel,
  Bot,
  MessageSquare,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { seoArticles } from "@/data/seoArticles";

const stripHtml = (html: string) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const staticArticles = [
  {
    slug: "/avis-ai-guide",
    title: "How AI is Reshaping Customer Review Management in 2026",
    description: "A complete guide to automating Google review responses with artificial intelligence.",
    icon: MessageSquare,
    color: "text-primary",
    bgColor: "bg-primary/10",
    category: "Guide",
    readTime: "5 min",
    date: "February 1, 2026",
  },
  {
    slug: "/avis-ai-restaurant",
    title: "How Restaurants Manage Google Reviews With AI",
    description: "Learn how artificial intelligence is transforming review management for restaurants.",
    icon: ChefHat,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    category: "Industry",
    readTime: "5 min",
    date: "January 28, 2026",
  },
  {
    slug: "/avis-ai-hotel",
    title: "Automated Google Review Management for Hotels",
    description: "How hotels use AI to reply to international guests consistently and at scale.",
    icon: Hotel,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    category: "Industry",
    readTime: "5 min",
    date: "January 28, 2026",
  },
  {
    slug: "/local-aeo",
    title: "Local GEO: Boost Your Visibility on ChatGPT, Gemini & Perplexity",
    description: "A complete guide to improving a local business's representation in generative AI answers.",
    icon: Bot,
    color: "text-violet-500",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    category: "Guide",
    readTime: "7 min",
    date: "January 27, 2026",
  },
];

const Blog = () => {
  const { data: dynamicArticles, isLoading } = useQuery({
    queryKey: ["published-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("published_articles")
        .select("id, title, slug, body, meta_description, author, published_at, created_at")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const calculateReadTime = (content: string) => {
    const words = content?.split(/\s+/).length || 0;
    return `${Math.max(1, Math.ceil(words / 200))} min`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy", { locale: enUS });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Google Reviews, Local SEO & AI Search Guides | Google Review AI</title>
        <meta
          name="description"
          content="Practical guides on Google review management, Google Business Profile optimization, Google Maps rankings, local SEO and AI search visibility."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://googlereviewai.com/blog" />
        <meta property="og:title" content="Google Review AI Guides — Reviews, Local SEO & AI Search" />
        <meta property="og:description" content="Actionable guides for improving review management and local visibility." />
        <meta property="og:url" content="https://googlereviewai.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://googlereviewai.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Google Review AI Guides",
          description: "Guides on Google reviews, Google Business Profile, local SEO and AI search visibility.",
          url: "https://googlereviewai.com/blog",
          hasPart: seoArticles.map((article) => ({
            "@type": "Article",
            headline: article.title,
            url: `https://googlereviewai.com/blog/${article.slug}`,
          })),
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Badge className="mb-4">Local growth library</Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Google Reviews, Local SEO & AI Search Guides</h1>
                <p className="text-lg text-muted-foreground">
                  Practical, source-backed guides to improve Google review management, Business Profile quality, Maps visibility and local AI search presence.
                </p>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="mb-7">
                  <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <Search className="w-6 h-6 text-primary" />
                    New SEO guides
                  </h2>
                  <p className="text-muted-foreground mt-2">10 in-depth articles built around distinct local-search and review-management intents.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seoArticles.map((article) => (
                    <Link key={article.slug} to={`/blog/${article.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span>
                          </div>
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-3">{article.title}</h3>
                          <p className="text-sm text-muted-foreground mb-5 line-clamp-3">{article.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Updated Aug 28, 2026</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {(dynamicArticles && dynamicArticles.length > 0) && (
            <section className="py-12 sm:py-16 bg-muted/20">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="w-6 h-6 text-primary" />Latest published articles</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dynamicArticles.map((article) => (
                      <Link key={article.id} to={`/blog/${article.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group overflow-hidden">
                          <CardContent className="p-6">
                            <Badge variant="outline" className="text-xs mb-4">Article</Badge>
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.meta_description || `${stripHtml(article.body).slice(0, 160)}…`}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{calculateReadTime(article.body)}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(article.published_at || article.created_at)}</span>
                              </div>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {isLoading && (
            <section className="py-12 sm:py-16 bg-muted/20">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center gap-2 mb-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /><span className="text-muted-foreground">Loading published articles...</span></div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-full mb-3" /><Skeleton className="h-4 w-3/4 mb-5" /><Skeleton className="h-16 w-full" /></CardContent></Card>)}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Bot className="w-6 h-6 text-primary" />More guides & tutorials</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {staticArticles.map((article) => (
                    <Link key={article.slug} to={article.slug}>
                      <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                        <CardContent className="p-6">
                          <div className={`w-10 h-10 rounded-lg ${article.bgColor} flex items-center justify-center mb-4`}><article.icon className={`w-5 h-5 ${article.color}`} /></div>
                          <Badge variant="secondary" className="text-xs mb-3">{article.category}</Badge>
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.description}</p>
                          <span className="text-xs text-muted-foreground">{article.readTime} · {article.date}</span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 bg-muted/30">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Put the guides into practice</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Manage reviews, monitor local visibility and build a repeatable reputation workflow with Google Review AI.</p>
              <Link to="/auth" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">Start free <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;
