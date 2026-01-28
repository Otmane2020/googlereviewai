import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  ChefHat, 
  Utensils,
  ThumbsUp,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const AvisAIRestaurant = () => {
  const benefits = [
    {
      icon: Clock,
      title: "Réponse en moins de 2h",
      description: "Vos clients reçoivent une réponse personnalisée automatiquement, même le soir et le week-end."
    },
    {
      icon: MessageSquare,
      title: "Ton adapté à la restauration",
      description: "L'IA comprend le vocabulaire culinaire et répond avec chaleur et professionnalisme."
    },
    {
      icon: TrendingUp,
      title: "+40% d'avis positifs",
      description: "Les clients satisfaits laissent plus d'avis quand ils voient que vous répondez."
    },
    {
      icon: ThumbsUp,
      title: "Gestion des critiques",
      description: "Réponses diplomatiques aux avis négatifs pour préserver votre réputation."
    }
  ];

  const useCases = [
    {
      type: "Restaurant gastronomique",
      example: "Merci infiniment pour ce magnifique retour ! Notre chef sera ravi de savoir que le tartare de Saint-Jacques vous a séduit. Au plaisir de vous accueillir à nouveau pour découvrir notre nouvelle carte de saison."
    },
    {
      type: "Pizzeria",
      example: "Grazie mille ! 🍕 On est contents que nos pizzas cuites au feu de bois vous aient régalé. À très vite pour une nouvelle soirée gourmande !"
    },
    {
      type: "Brasserie",
      example: "Merci beaucoup pour votre avis ! Notre équipe met un point d'honneur à proposer une cuisine traditionnelle de qualité. On vous attend pour le prochain plat du jour !"
    }
  ];

  const stats = [
    { value: "2h", label: "Temps de réponse moyen" },
    { value: "98%", label: "Avis traités automatiquement" },
    { value: "+4.6", label: "Note moyenne des clients" },
    { value: "15min", label: "Gagnées par jour" }
  ];

  return (
    <>
      <Helmet>
        <title>Avis Google Restaurant IA - Réponses Automatiques | Starlinko</title>
        <meta 
          name="description" 
          content="Automatisez la gestion des avis Google de votre restaurant avec l'IA. Réponses personnalisées en 2h, ton adapté à la restauration. Essai gratuit 7 jours." 
        />
        <meta name="keywords" content="avis google restaurant, réponse automatique avis, IA restauration, gestion avis restaurant, réputation restaurant" />
        <link rel="canonical" href="https://starlinko.app/avis-ai-restaurant" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Gestion des Avis Google Restaurant avec l'IA" />
        <meta property="og:description" content="Répondez automatiquement aux avis de votre restaurant. Personnalisé, rapide, professionnel." />
        <meta property="og:url" content="https://starlinko.app/avis-ai-restaurant" />
        <meta property="og:type" content="website" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Starlinko pour Restaurants",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Solution IA de gestion automatique des avis Google pour restaurants",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "description": "Essai gratuit 7 jours"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 sm:py-24 bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  <ChefHat className="w-3 h-3 mr-1" />
                  Solution pour Restaurants
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Gérez vos avis Google{" "}
                  <span className="text-orange-500">automatiquement</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Répondez à chaque avis client en moins de 2 heures avec des réponses personnalisées 
                  adaptées à l'univers de la restauration. Gagnez du temps, fidélisez vos clients.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link to="/auth">
                      Essai gratuit 7 jours
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/select-plan">Voir les tarifs</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 border-y bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Pourquoi les restaurateurs choisissent Starlinko
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Une solution pensée pour les professionnels de la restauration qui n'ont pas le temps 
                  de répondre manuellement à chaque avis.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-orange-100 dark:border-orange-900/30">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-orange-500" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Examples Section */}
          <section className="py-16 sm:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Exemples de réponses générées par l'IA
                </h2>
                <p className="text-muted-foreground">
                  Des réponses adaptées à chaque type d'établissement
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {useCases.map((useCase, index) => (
                  <Card key={index} className="bg-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Utensils className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm">{useCase.type}</span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{useCase.example}"</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
                        <Zap className="w-3 h-3" />
                        Réponse générée automatiquement
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Comment ça fonctionne ?
                </h2>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-6">
                {[
                  { step: "1", title: "Connectez votre fiche Google", desc: "En 2 clics, liez votre Google Business Profile" },
                  { step: "2", title: "L'IA analyse chaque avis", desc: "Compréhension du contexte, du ton et des points mentionnés" },
                  { step: "3", title: "Réponse personnalisée générée", desc: "Adaptée à votre restaurant et au contenu de l'avis" },
                  { step: "4", title: "Publication automatique", desc: "La réponse est publiée directement sur Google" }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 sm:py-24 bg-orange-500 text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Prêt à automatiser vos réponses ?
              </h2>
              <p className="text-orange-100 mb-8 max-w-xl mx-auto">
                Rejoignez les restaurateurs qui gagnent 15 minutes par jour grâce à Starlinko.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
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

export default AvisAIRestaurant;
