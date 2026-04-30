import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { Helmet } from "react-helmet";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['published-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('published_articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Estimate reading time
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

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

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
            <h1 className="text-2xl font-bold mb-4">Article not found</h1>
            <p className="text-muted-foreground mb-6">
              The article you are looking for does not exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const publishedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const readingTime = getReadingTime(article.body);

  return (
    <>
      <Helmet>
        <title>{article.title} | Ranki.ai Blog</title>
        <meta 
          name="description" 
          content={article.meta_description || article.body.substring(0, 155) + '...'} 
        />
        <link rel="canonical" href={`https://ranki.ai/blog/${article.slug}`} />
        
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.meta_description || article.body.substring(0, 155)} />
        <meta property="og:url" content={`https://ranki.ai/blog/${article.slug}`} />
        <meta property="og:type" content="article" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.meta_description || article.body.substring(0, 155),
            "datePublished": article.published_at,
            "dateModified": article.updated_at,
            "author": {
              "@type": "Organization",
              "name": article.author || "Ranki.ai"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Ranki.ai",
              "url": "https://ranki.ai"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Back link */}
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <Link 
              to="/blog" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to blog
            </Link>
          </div>

          {/* Article header */}
          <header className="container mx-auto px-4 pb-8 max-w-4xl">
            <Badge className="mb-4">Article</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {article.author || 'Ranki.ai Team'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {publishedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </span>
            </div>
          </header>

          {/* Article content */}
          <article className="container mx-auto px-4 pb-16 max-w-4xl">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground
                prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-muted"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </article>

          {/* CTA Section */}
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4 text-center max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">
                Ready to rank in AI search?
              </h2>
              <p className="text-muted-foreground mb-6">
                Try Ranki.ai free and discover how AI can boost your visibility inside ChatGPT, Gemini and Perplexity.
              </p>
              <Button asChild size="lg">
                <Link to="/auth">
                  Start free
                </Link>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BlogArticle;
