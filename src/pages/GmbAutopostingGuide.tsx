import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Search,
  MessageSquareText,
  CalendarClock,
  BotIcon,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Globe,
  Sparkles,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const GmbAutopostingGuide = () => {
  const benefits = [
    {
      icon: CalendarClock,
      title: "Publication automatique quotidienne",
      description: "Vos posts sont générés et publiés chaque jour sans intervention manuelle."
    },
    {
      icon: Search,
      title: "Optimisation SEO locale",
      description: "Contenu enrichi en mots-clés pertinents pour améliorer votre visibilité locale."
    },
    {
      icon: BotIcon,
      title: "IA spécialisée commerce local",
      description: "Intelligence artificielle entraînée sur les meilleures pratiques Google My Business."
    },
    {
      icon: BarChart3,
      title: "Suivi des performances",
      description: "Analysez l'impact de vos publications sur votre référencement local."
    }
  ];

  const features = [
    {
      icon: MessageSquareText,
      title: "Posts Google My Business",
      description: "Publiez des actualités, offres et événements automatiquement sur votre fiche."
    },
    {
      icon: Target,
      title: "Questions & Réponses AEO",
      description: "Générez des FAQ optimisées pour apparaître dans les résultats IA (ChatGPT, Google AI)."
    },
    {
      icon: Globe,
      title: "Articles SEO locaux",
      description: "Créez du contenu géolocalisé pour dominer les recherches dans votre zone."
    }
  ];

  const stats = [
    { value: "3x", label: "Plus de visibilité locale" },
    { value: "7j/7", label: "Publication automatique" },
    { value: "+65%", label: "Engagement sur GMB" },
    { value: "0h", label: "De travail pour vous" }
  ];

  const useCases = [
    {
      title: "Post d'actualité",
      content: "Découvrez notre nouvelle carte de printemps ! 🌸 Des plats frais et de saison vous attendent. Réservez votre table dès maintenant.",
      type: "STANDARD"
    },
    {
      title: "Offre promotionnelle",
      content: "-20% sur votre première visite ! Profitez de notre offre de bienvenue valable tout le mois. Mentionnez ce post à l'accueil.",
      type: "OFFER"
    },
    {
      title: "Q&A pour ChatGPT",
      content: "Q: Quels sont les horaires d'ouverture de [Entreprise] ?\nR: Nous sommes ouverts du lundi au samedi de 9h à 19h. Fermé le dimanche.",
      type: "AEO"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Autoposting Google My Business avec IA - Améliorer son SEO Local | Starlinko</title>
        <meta 
          name="description" 
          content="Automatisez vos publications Google My Business avec l'IA. Posts quotidiens, Q&A optimisés AEO, articles SEO locaux. Boostez votre référencement local sans effort." 
        />
        <meta name="keywords" content="google my business autoposting, publication automatique gmb, seo local ia, posts gmb automatiques, référencement local, aeo chatgpt" />
        <link rel="canonical" href="https://starlinko.app/gmb-autoposting" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Autoposting Google My Business avec IA - Boostez votre SEO Local" />
        <meta property="og:description" content="Publications automatiques sur GMB, Q&A AEO pour ChatGPT, articles SEO locaux. L'IA au service de votre visibilité." />
        <meta property="og:url" content="https://starlinko.app/gmb-autoposting" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://starlinko.app/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Autoposting Google My Business avec IA" />
        <meta name="twitter:description" content="Automatisez vos publications GMB et boostez votre SEO local avec l'IA." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Starlinko - Autoposting Google My Business",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Solution IA d'autoposting pour Google My Business. Publications automatiques, Q&A AEO, articles SEO locaux.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "description": "Essai gratuit 7 jours"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "230"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Qu'est-ce que l'autoposting Google My Business ?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "L'autoposting GMB permet de publier automatiquement du contenu sur votre fiche Google My Business grâce à l'intelligence artificielle. Les posts sont générés et publiés quotidiennement sans intervention manuelle."
                }
              },
              {
                "@type": "Question",
                "name": "Comment l'IA améliore-t-elle mon SEO local ?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "L'IA génère du contenu optimisé avec des mots-clés pertinents pour votre activité et votre zone géographique. Les publications régulières signalent à Google que votre entreprise est active, améliorant ainsi votre positionnement local."
                }
              },
              {
                "@type": "Question",
                "name": "Qu'est-ce que l'AEO (Answer Engine Optimization) ?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "L'AEO optimise votre contenu pour les moteurs de réponse IA comme ChatGPT et Google AI Overview. En publiant des questions-réponses structurées, vous augmentez vos chances d'être cité par ces assistants IA."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <Badge className="mb-4 bg-primary/10 text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Propulsé par l'IA
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Autoposting Google My Business{" "}
                  <span className="text-primary">avec l'IA</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Publiez automatiquement sur votre fiche Google, générez des Q&A pour ChatGPT 
                  et créez des articles SEO locaux. L'IA travaille pour votre visibilité 24h/24.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link to="/auth">
                      Commencer gratuitement
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/choose-plan">Voir les tarifs</Link>
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mt-4">
                  ✓ Essai gratuit 7 jours &nbsp; ✓ Sans carte bancaire &nbsp; ✓ Annulation facile
                </p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 border-y bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* What is Autoposting */}
          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
                  Qu'est-ce que l'Autoposting GMB ?
                </h2>
                
                <div className="prose prose-lg dark:prose-invert mx-auto">
                  <p className="text-muted-foreground text-center mb-8">
                    L'autoposting Google My Business consiste à publier automatiquement du contenu 
                    sur votre fiche Google grâce à l'intelligence artificielle. Chaque jour, notre IA 
                    génère et publie des posts optimisés pour améliorer votre référencement local.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                  {features.map((feature, index) => (
                    <Card key={index} className="text-center">
                      <CardContent className="pt-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <feature.icon className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 sm:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Pourquoi utiliser l'autoposting IA ?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Gagnez du temps tout en améliorant votre visibilité locale. L'IA s'occupe de tout.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-primary" />
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
          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Exemples de contenus générés par l'IA
                </h2>
                <p className="text-muted-foreground">
                  Des publications adaptées à votre activité et optimisées pour le SEO
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {useCases.map((useCase, index) => (
                  <Card key={index} className="bg-card">
                    <CardContent className="pt-6">
                      <Badge variant="secondary" className="mb-4">
                        {useCase.type}
                      </Badge>
                      <h3 className="font-semibold mb-3">{useCase.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {useCase.content}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
                        <Zap className="w-3 h-3" />
                        Généré automatiquement par l'IA
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* SEO Benefits Section */}
          <section className="py-16 sm:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Comment l'IA améliore votre SEO local
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Search className="w-5 h-5 text-primary" />
                      Référencement Google Maps
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Publications régulières = fiche active aux yeux de Google",
                        "Mots-clés locaux intégrés naturellement",
                        "Augmentation du temps passé sur votre fiche",
                        "Plus d'interactions = meilleur classement"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <BotIcon className="w-5 h-5 text-primary" />
                      Optimisation pour l'IA (AEO)
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Q&A structurées pour ChatGPT et Google AI",
                        "Format question-réponse optimisé",
                        "Contenu cité par les assistants IA",
                        "Positionnement sur les recherches vocales"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
                  { step: "1", title: "Connectez votre fiche Google", desc: "Liez votre compte Google My Business en quelques clics" },
                  { step: "2", title: "Configurez vos préférences", desc: "Choisissez les mots-clés, le ton et l'heure de publication" },
                  { step: "3", title: "L'IA génère le contenu", desc: "Chaque jour, l'IA crée des posts optimisés pour votre activité" },
                  { step: "4", title: "Publication automatique", desc: "Le contenu est publié sur GMB à l'heure de votre choix" }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
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

          {/* FAQ Section */}
          <section className="py-16 sm:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
                  Questions fréquentes
                </h2>
                
                <div className="space-y-6">
                  {[
                    {
                      q: "Est-ce que Google accepte l'autoposting ?",
                      a: "Oui, les publications sont effectuées via l'API officielle de Google My Business. C'est une pratique courante et acceptée par Google."
                    },
                    {
                      q: "Puis-je personnaliser le contenu généré ?",
                      a: "Absolument. Vous pouvez définir vos mots-clés, le ton des messages, et prévisualiser/modifier chaque post avant publication si vous le souhaitez."
                    },
                    {
                      q: "Quelle est la fréquence de publication ?",
                      a: "Par défaut, l'IA publie un post par jour. Vous pouvez ajuster cette fréquence selon vos besoins dans les paramètres."
                    },
                    {
                      q: "Est-ce que ça fonctionne pour tous les secteurs ?",
                      a: "Oui, l'IA s'adapte à tous les types d'entreprises : restaurants, commerces, services, professions libérales, etc."
                    }
                  ].map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <h3 className="font-semibold mb-2">{faq.q}</h3>
                        <p className="text-muted-foreground">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready à automatiser votre présence Google ?
              </h2>
              <p className="opacity-90 mb-8 max-w-xl mx-auto">
                Rejoignez les entreprises qui boostent leur SEO local avec l'IA. 
                Configuration en 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/auth">
                    Essai gratuit 7 jours
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/gmb-post">Voir la démo</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default GmbAutopostingGuide;
