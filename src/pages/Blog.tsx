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
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

const stripHtml = (html: string) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Static editorial guides
const staticArticles = [
  {
    slug: "/avis-ai-guide",
    title: "How AI is Reshaping Customer Review Management in 2026",
    description: "A complete guide to automating Google review responses with artificial intelligence. Discover how GoogleReviewAI transforms your reputation management.",
    icon: MessageSquare,
    color: "text-primary",
    bgColor: "bg-primary/10",
    category: "Guide",
    readTime: "5 min",
    date: "February 1, 2026"
  },
  {
    slug: "/avis-ai-restaurant",
    title: "How Restaurants Manage Google Reviews With AI",
    description: "Learn how artificial intelligence is transforming review management for restaurants, pizzerias and brasseries.",
    icon: ChefHat,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    category: "Industry",
    readTime: "5 min",
    date: "January 28, 2026"
  },
  {
    slug: "/avis-ai-hotel",
    title: "Automated Google Review Management for Hotels",
    description: "How hotels use AI to reply to international guests in 12 languages, 24/7.",
    icon: Hotel,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    category: "Industry",
    readTime: "5 min",
    date: "January 28, 2026"
  },
  {
    slug: "/local-aeo",
    title: "Local GEO: Boost Your Visibility on ChatGPT, Gemini & Perplexity",
    description: "A complete guide to appearing in generative AI answers from ChatGPT, Gemini and Perplexity through local Generative Engine Optimization.",
    icon: Bot,
    color: "text-violet-500",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    category: "Guide",
    readTime: "7 min",
    date: "January 27, 2026"
  }
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
    const wordsPerMinute = 200;
    const words = content?.split(/\s+/).length || 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
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
        <title>Blog – Local GEO, AI Search & Google Reviews | GoogleReviewAI</title>
        <meta 
          name="description" 
          content="Articles and guides on Generative Engine Optimization (GEO), local AI search and Google review management for local businesses. Expert insights from GoogleReviewAI." 
        />
        <meta name="keywords" content="GEO blog, generative engine optimization, ChatGPT ranking, Gemini ranking, Perplexity, local SEO, AI search, Google reviews" />
        <link rel="canonical" href="https://googlereviewai.com/blog" />
        
        <meta property="og:title" content="GoogleReviewAI Blog – Local GEO & AI Search" />
        <meta property="og:description" content="Guides and tactics to rank locally inside ChatGPT, Gemini and Perplexity." />
        <meta property="og:url" content="https://googlereviewai.com/blog" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Badge className="mb-4">Blog</Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Resources & Guides
                </h1>
                <p className="text-lg text-muted-foreground">
                  Expert insights to manage your Google reviews, optimize local SEO 
                  and rank inside generative AI engines like ChatGPT, Gemini and Perplexity.
                </p>
              </div>
            </div>
          </section>

          {(dynamicArticles && dynamicArticles.length > 0) && (
            <section className="py-12 sm:py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Latest articles
                  </h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dynamicArticles.map((article) => (
                      <Link key={article.id} to={`/blog/${article.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-secondary" />
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Article
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {article.title}
                            </h3>
                            
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {article.meta_description || (stripHtml(article.body).slice(0, 160) + "…")}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {calculateReadTime(article.body)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(article.published_at || article.created_at)}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <section className="py-12 sm:py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center gap-2 mb-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading articles...</span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="h-full">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <Skeleton className="w-16 h-5" />
                          </div>
                          <Skeleton className="h-6 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4 mb-4" />
                          <Skeleton className="h-16 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="py-12 sm:py-16 bg-muted/20">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-primary" />
                  Guides & Tutorials
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staticArticles.map((article, index) => (
                    <Link key={index} to={article.slug}>
                      <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`w-10 h-10 rounded-lg ${article.bgColor} flex items-center justify-center`}>
                              <article.icon className={`w-5 h-5 ${article.color}`} />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {article.category}
                            </Badge>
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {article.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {article.readTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {article.date}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to rank in AI search?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Try GoogleReviewAI free and discover how AI can boost your visibility inside ChatGPT, Gemini and Perplexity.
              </p>
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
