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
  Hotel, 
  Bed,
  ThumbsUp,
  Zap,
  Globe,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FAQPageSchema, BreadcrumbSchema } from "@/components/StructuredData";

interface AvisAIHotelProps {
  canonicalSlug?: string;
  breadcrumbName?: string;
  pageTitle?: string;
  pageDescription?: string;
}

const AvisAIHotel = ({
  canonicalSlug = "avis-ai-hotel",
  breadcrumbName = "Avis IA Hôtel",
  pageTitle = "Avis Google Hôtel IA - Réponses Automatiques Multilingues | Ranki.ai",
  pageDescription = "Automatisez la gestion des avis Google de votre hôtel avec l'IA. Réponses multilingues 24h/24, ton hôtelier professionnel. Essai gratuit 7 jours.",
}: AvisAIHotelProps = {}) => {
  const canonicalUrl = `https://ranki.ai/${canonicalSlug}`;
  const benefits = [
    {
      icon: Clock,
      title: "Réponse 24h/24",
      description: "Répondez aux avis de vos clients internationaux à toute heure, même la nuit."
    },
    {
      icon: Globe,
      title: "Multilingue automatique",
      description: "L'IA détecte la langue et répond en français, anglais, allemand, espagnol..."
    },
    {
      icon: TrendingUp,
      title: "Améliore votre ranking",
      description: "Les hôtels qui répondent rapidement sont mieux classés sur Google et Booking."
    },
    {
      icon: ThumbsUp,
      title: "Gestion des plaintes",
      description: "Réponses professionnelles aux critiques pour limiter l'impact sur votre réputation."
    }
  ];

  const useCases = [
    {
      type: "Hôtel de luxe",
      stars: 5,
      example: "Thank you so much for this wonderful review! We are delighted that our spa and the attention of our team made your stay memorable. We hope to welcome you again soon for another exceptional experience."
    },
    {
      type: "Hôtel boutique",
      stars: 4,
      example: "Merci pour ce retour chaleureux ! Notre équipe est ravie que vous ayez apprécié le charme de notre établissement et notre petit-déjeuner maison. À très bientôt !"
    },
    {
      type: "Résidence de tourisme",
      stars: 3,
      example: "Vielen Dank für Ihre Bewertung! Wir freuen uns, dass Sie Ihren Aufenthalt bei uns genossen haben. Bis bald!"
    }
  ];

  const stats = [
    { value: "24/7", label: "Réponses automatiques" },
    { value: "12", label: "Langues supportées" },
    { value: "+0.3★", label: "Note moyenne gagnée" },
    { value: "95%", label: "Clients satisfaits" }
  ];

  const hotelFaqs = [
    {
      question: "Comment répondre aux avis Google d'un hôtel en plusieurs langues ?",
      answer: "Ranki.ai détecte automatiquement la langue de l'avis et génère une réponse dans la même langue. L'IA supporte 12 langues dont le français, l'anglais, l'allemand, l'espagnol, l'italien, le portugais et le néerlandais, idéal pour les hôtels avec une clientèle internationale."
    },
    {
      question: "L'IA peut-elle répondre aux avis d'un hôtel 24h/24 ?",
      answer: "Oui, Ranki.ai fonctionne 24h/24 et 7j/7. Les avis reçus la nuit, le week-end ou pendant les vacances reçoivent une réponse automatique personnalisée. C'est particulièrement utile pour les hôtels dont les clients publient des avis à toute heure."
    },
    {
      question: "Comment l'IA adapte-t-elle le ton pour l'hôtellerie de luxe ?",
      answer: "L'IA de Ranki.ai permet de configurer le ton de réponse selon le positionnement de votre hôtel : luxe raffiné, boutique-hôtel chaleureux, familial décontracté. Les réponses respectent les standards de service attendus dans l'hôtellerie haut de gamme."
    },
    {
      question: "Répondre aux avis améliore-t-il le classement d'un hôtel sur Google ?",
      answer: "Oui, Google favorise les fiches actives avec des réponses régulières aux avis. Les hôtels qui répondent à 100% de leurs avis gagnent en moyenne +0.3 étoile sur leur note globale et améliorent leur positionnement sur Google Maps et dans les résultats locaux."
    },
    {
      question: "Ranki.ai gère-t-il les plaintes et avis négatifs d'un hôtel ?",
      answer: "Oui, l'IA génère des réponses professionnelles et empathiques aux avis négatifs. Elle reconnaît le problème spécifique (bruit, propreté, service), présente des excuses sincères et propose une solution concrète, limitant l'impact sur votre réputation en ligne."
    }
  ];

  return (
    <>
      <FAQPageSchema faqs={hotelFaqs} />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://ranki.ai" },
        { name: "Avis IA Hôtel", url: "https://ranki.ai/avis-ai-hotel" }
      ]} />
      <Helmet>
        <title>Avis Google Hôtel IA - Réponses Automatiques Multilingues | Ranki.ai</title>
        <meta 
          name="description" 
          content="Automatisez la gestion des avis Google de votre hôtel avec l'IA. Réponses multilingues 24h/24, ton hôtelier professionnel. Essai gratuit 7 jours." 
        />
        <meta name="keywords" content="avis google hotel, réponse automatique avis hotel, IA hôtellerie, gestion avis hotel, réputation hôtel" />
        <link rel="canonical" href="https://ranki.ai/avis-ai-hotel" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Gestion des Avis Google Hôtel avec l'IA" />
        <meta property="og:description" content="Répondez automatiquement aux avis de votre hôtel en 12 langues. Professionnel et personnalisé." />
        <meta property="og:url" content="https://ranki.ai/avis-ai-hotel" />
        <meta property="og:type" content="website" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Ranki.ai pour Hôtels",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Solution IA de gestion automatique des avis Google pour hôtels et hébergements",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "description": "Essai gratuit 7 jours"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "85"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 sm:py-24 bg-gradient-to-b from-blue-50 to-background dark:from-blue-950/20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Hotel className="w-3 h-3 mr-1" />
                  Solution pour Hôtels
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Répondez aux avis{" "}
                  <span className="text-blue-500">en 12 langues</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Gérez automatiquement les avis de vos clients internationaux 24h/24. 
                  L'IA détecte la langue et répond avec le professionnalisme attendu dans l'hôtellerie.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600">
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
                    <div className="text-3xl sm:text-4xl font-bold text-blue-500 mb-1">
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
                  Conçu pour l'hôtellerie internationale
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Une solution qui comprend les spécificités de l'hôtellerie : clientèle internationale, 
                  standards de service, et importance de la e-réputation.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-blue-100 dark:border-blue-900/30">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-blue-500" />
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
                  Réponses multilingues automatiques
                </h2>
                <p className="text-muted-foreground">
                  L'IA répond dans la langue de votre client
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {useCases.map((useCase, index) => (
                  <Card key={index} className="bg-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Bed className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-sm">{useCase.type}</span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[...Array(useCase.stars)].map((_, i) => (
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

          {/* Platforms Section */}
          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Compatible avec vos plateformes
                </h2>
                <p className="text-muted-foreground">
                  Gérez vos avis Google et améliorez votre visibilité sur toutes les plateformes
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 opacity-60">
                {["Google", "TripAdvisor*", "Booking*", "Expedia*"].map((platform) => (
                  <div key={platform} className="text-xl font-semibold text-muted-foreground">
                    {platform}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                * Intégration Google Business Profile. Les autres plateformes bénéficient indirectement d'une meilleure réputation.
              </p>
            </div>
          </section>

          {/* How it works */}
          <section className="py-16 sm:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Mise en place en 5 minutes
                </h2>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-6">
                {[
                  { step: "1", title: "Connectez votre Google Business Profile", desc: "Authentification sécurisée OAuth en 2 clics" },
                  { step: "2", title: "Personnalisez le ton de réponse", desc: "Luxe, décontracté, familial... Adaptez à votre positionnement" },
                  { step: "3", title: "L'IA prend le relais", desc: "Chaque nouvel avis reçoit une réponse personnalisée automatiquement" },
                  { step: "4", title: "Suivez vos performances", desc: "Dashboard avec statistiques et évolution de votre note" }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">
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
          <section className="py-16 sm:py-24 bg-blue-500 text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready à améliorer votre réputation ?
              </h2>
              <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                Rejoignez les hôteliers qui répondent à 100% de leurs avis grâce à Ranki.ai.
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

export default AvisAIHotel;
