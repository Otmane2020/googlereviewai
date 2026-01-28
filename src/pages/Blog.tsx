import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChefHat, 
  Hotel, 
  Bot,
  ArrowRight,
  Calendar,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const articles = [
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

          {/* Articles Grid */}
          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {articles.map((article, index) => (
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
                        
                        <h2 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                        
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
