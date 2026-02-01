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
import { fr } from "date-fns/locale";

// Articles statiques (guides internes)
const staticArticles = [
  {
    slug: "/avis-ai-guide",
    title: "Comment l'IA révolutionne la gestion des avis clients en 2026",
    description: "Guide complet pour automatiser vos réponses aux avis Google avec l'intelligence artificielle. Découvrez comment Starlinko transforme votre gestion de réputation.",
    icon: MessageSquare,
    color: "text-primary",
    bgColor: "bg-primary/10",
    category: "Guide",
    readTime: "5 min",
    date: "1 février 2026"
  },
  {
    slug: "/avis-ai-restaurant",
    title: "Comment les restaurants gèrent leurs avis Google avec l'IA",
    description: "Découvrez comment l'intelligence artificielle révolutionne la gestion des avis clients pour les restaurants, pizzerias et brasseries.",
    icon: ChefHat,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    category: "Secteur",
    readTime: "5 min",
    date: "28 janvier 2026"
  },
  {
    slug: "/avis-ai-hotel",
    title: "Gestion automatique des avis Google pour hôtels",
    description: "Comment les hôtels utilisent l'IA pour répondre en 12 langues à leurs clients internationaux 24h/24.",
    icon: Hotel,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    category: "Secteur",
    readTime: "5 min",
    date: "28 janvier 2026"
  },
  {
    slug: "/local-aeo",
    title: "AEO Local : Optimisez votre visibilité sur ChatGPT et Gemini",
    description: "Guide complet pour apparaître dans les réponses des IA génératives comme ChatGPT, Gemini et Perplexity grâce à l'AEO local.",
    icon: Bot,
    color: "text-violet-500",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    category: "Guide",
    readTime: "7 min",
    date: "27 janvier 2026"
  }
];

const Blog = () => {
  // Récupérer les articles dynamiques depuis la base de données
  const { data: dynamicArticles, isLoading } = useQuery({
    queryKey: ["published-articles"],
    queryFn: async () => {
      console.log("[Blog] Fetching published articles...");
      const { data, error } = await supabase
        .from("published_articles")
        .select("id, title, slug, body, meta_description, author, published_at, created_at")
        .order("published_at", { ascending: false });
      
      if (error) {
        console.error("[Blog] Error fetching articles:", error);
        throw error;
      }
      console.log("[Blog] Fetched articles:", data?.length, data?.map(a => a.slug));
      return data || [];
    },
    staleTime: 0, // Toujours refetch au montage
    refetchOnWindowFocus: true,
  });

  // Calculer le temps de lecture estimé
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content?.split(/\s+/).length || 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Helmet>
        <title>Blog - Conseils SEO Local & Gestion des Avis Google | Starlinko</title>
        <meta 
          name="description" 
          content="Articles et guides sur la gestion des avis Google, le SEO local et l'AEO pour les commerces et entreprises locales. Conseils d'experts." 
        />
        <meta name="keywords" content="blog avis google, SEO local, AEO, gestion réputation, avis clients, IA" />
        <link rel="canonical" href="https://starlinko.app/blog" />
        
        <meta property="og:title" content="Blog Starlinko - SEO Local & Gestion des Avis" />
        <meta property="og:description" content="Conseils et guides pour gérer vos avis Google et améliorer votre visibilité locale." />
        <meta property="og:url" content="https://starlinko.app/blog" />
        <meta property="og:type" content="blog" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Badge className="mb-4">Blog</Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Ressources & Guides
                </h1>
                <p className="text-lg text-muted-foreground">
                  Conseils d'experts pour gérer vos avis Google, optimiser votre SEO local 
                  et apparaître dans les réponses des IA génératives.
                </p>
              </div>
            </div>
          </section>

          {/* Dynamic Articles from Database */}
          {(dynamicArticles && dynamicArticles.length > 0) && (
            <section className="py-12 sm:py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Derniers articles
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
                              {article.meta_description || article.body?.substring(0, 150) + "..."}
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

          {/* Loading State */}
          {isLoading && (
            <section className="py-12 sm:py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center gap-2 mb-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Chargement des articles...</span>
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

          {/* Static Articles Grid */}
          <section className="py-12 sm:py-16 bg-muted/20">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-primary" />
                  Guides & Tutoriels
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

          {/* CTA Section */}
          <section className="py-12 sm:py-16 bg-muted/30">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Prêt à automatiser vos avis ?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Testez Starlinko gratuitement pendant 7 jours et découvrez comment l'IA peut transformer votre gestion des avis.
              </p>
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Essai gratuit
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
