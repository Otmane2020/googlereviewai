import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Bot, MessageSquare, TrendingUp, Target, Zap, Clock, CheckCircle2, ArrowRight, Star, MapPin, Search } from "lucide-react";
import { FAQPageSchema, BreadcrumbSchema } from "@/components/StructuredData";
import { BrandSparkle } from "@/components/BrandSparkle";

const LocalAEO = () => {
  

  const features = [
    {
      icon: Bot,
      title: "Optimisation IA",
      description: "Vos fiches Google My Business optimisées pour ChatGPT, Gemini, Perplexity et tous les assistants IA"
    },
    {
      icon: MessageSquare,
      title: "Q&A Automatiques",
      description: "Génération quotidienne de questions-réponses pertinentes basées sur vos mots-clés locaux"
    },
    {
      icon: TrendingUp,
      title: "Visibilité Accrue",
      description: "Apparaissez dans les réponses IA quand les utilisateurs cherchent des services près de chez eux"
    },
    {
      icon: Target,
      title: "Ciblage Local",
      description: "Contenu optimisé pour votre zone géographique et vos services spécifiques"
    },
    {
      icon: Zap,
      title: "Publication Auto",
      description: "Les Q&A sont automatiquement publiés sur Google My Business chaque jour"
    },
    {
      icon: Clock,
      title: "Gain de Temps",
      description: "100% automatisé - l'IA travaille pendant que vous vous concentrez sur votre business"
    }
  ];

  const benefits = [
    "Apparaître dans les réponses de ChatGPT pour les recherches locales",
    "Generate du contenu Q&A optimisé automatiquement",
    "Améliorer votre référencement Google My Business",
    "Attirer plus de clients via les assistants IA",
    "Devancer vos concurrents sur ce nouveau canal",
    "Aucune compétence technique requise"
  ];

  const useCases = [
    {
      business: "Restaurant",
      question: "Quel est le meilleur restaurant italien près de Montmartre ?",
      benefit: "Votre restaurant apparaît dans la réponse de ChatGPT"
    },
    {
      business: "Plombier",
      question: "J'ai besoin d'un plombier urgentiste dans le 15ème",
      benefit: "Les assistants IA recommandent votre service"
    },
    {
      business: "Coiffeur",
      question: "Où faire une coupe tendance à Lyon ?",
      benefit: "Votre salon est mentionné par Gemini et ChatGPT"
    }
  ];

  const aeoFaqs = [
    {
      question: "Comment apparaître dans les réponses de ChatGPT pour les recherches locales ?",
      answer: "Pour apparaître dans ChatGPT pour les recherches locales, il faut publier du contenu structuré en format question-réponse sur votre fiche Google Business Profile. GoogleReviewAI automatise ce processus via son module AEO qui génère et publie quotidiennement des Q&A optimisés spécifiquement pour les moteurs de réponse IA."
    },
    {
      question: "Qu'est-ce que l'AEO (Answer Engine Optimization) ?",
      answer: "L'AEO (Answer Engine Optimization) est le référencement pour les moteurs de réponse IA comme ChatGPT, Gemini, Claude et Perplexity. Contrairement au SEO qui optimise pour les moteurs de recherche traditionnels, l'AEO optimise votre contenu pour être cité directement dans les réponses des assistants IA."
    },
    {
      question: "Quelle est la différence entre SEO local et AEO local ?",
      answer: "Le SEO local optimise votre positionnement dans Google Maps et les résultats de recherche locaux. L'AEO local optimise votre contenu pour que les assistants IA (ChatGPT, Gemini) recommandent votre entreprise lorsque les utilisateurs posent des questions sur des services près de chez eux. GoogleReviewAI combine les deux pour maximiser votre visibilité."
    },
    {
      question: "Comment GoogleReviewAI génère-t-il des Q&A pour ChatGPT ?",
      answer: "GoogleReviewAI utilise l'IA pour analyser votre activité, vos mots-clés et votre zone géographique. Il génère ensuite des questions-réponses pertinentes en format structuré et les publie automatiquement sur votre fiche Google Business Profile chaque jour, maximisant vos chances d'être cité par les IA."
    },
    {
      question: "Combien de temps faut-il pour apparaître dans les réponses IA ?",
      answer: "Les premiers résultats sont généralement visibles en 30 à 60 jours. GoogleReviewAI publie du contenu AEO quotidiennement, créant un effet cumulatif. Plus votre contenu est riche et régulier, plus les chances d'être cité par ChatGPT et les autres IA augmentent."
    },
    {
      question: "L'AEO fonctionne-t-il pour tous les secteurs d'activité ?",
      answer: "Oui, l'AEO est efficace pour toutes les entreprises locales : restaurants, hôtels, salons de coiffure, garages, professionnels de santé, commerces, artisans. GoogleReviewAI adapte le contenu Q&A à chaque secteur pour répondre aux questions que les utilisateurs posent réellement aux assistants IA."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Local AEO – Apparaissez dans ChatGPT & Gemini | GoogleReviewAI</title>
        <meta
          name="description"
          content="Optimisez votre visibilité locale dans ChatGPT, Gemini et les assistants IA. Générez automatiquement des Q&A AEO pour être recommandé par l'IA. Essai gratuit."
        />
        <link rel="canonical" href="https://googlereviewai.com/local-aeo" />
        <meta property="og:title" content="Local AEO – Apparaissez dans ChatGPT & Gemini" />
        <meta property="og:description" content="Optimisez votre présence pour les moteurs de réponse IA. Q&A automatiques publiés sur Google Business Profile." />
        <meta property="og:url" content="https://googlereviewai.com/local-aeo" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://googlereviewai.com/og-image.png" />
      </Helmet>
      <FAQPageSchema faqs={aeoFaqs} />
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://googlereviewai.com" },
        { name: "Local AEO", url: "https://googlereviewai.com/local-aeo" }
      ]} />
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-95" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <BrandSparkle className="w-4 h-4 text-accent" />
                <span className="text-white/90 text-sm font-medium">Nouveau : Optimisation pour ChatGPT & IA</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Soyez Recommandé par{" "}
                <span className="text-accent">ChatGPT</span> pour vos Services Locaux
              </h1>
              
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Local AEO (Answer Engine Optimization) optimise votre présence pour les assistants IA. 
                Quand les utilisateurs demandent des recommandations locales à ChatGPT, Gemini ou Perplexity, 
                votre entreprise apparaît en premier.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8">
                    Essayer Gratuitement
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/select-plan">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                    Voir les Tarifs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is Local AEO */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Qu'est-ce que le Local AEO ?
              </h2>
              <p className="text-muted-foreground text-lg">
                L'AEO (Answer Engine Optimization) est le nouveau SEO pour l'ère de l'IA. 
                Contrairement au SEO traditionnel qui optimise pour les moteurs de recherche, 
                le Local AEO optimise votre contenu pour être cité par les assistants IA 
                comme ChatGPT, Gemini, Claude et Perplexity.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {useCases.map((useCase, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">{useCase.business}</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Search className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground italic">"{useCase.question}"</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground">{useCase.benefit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Comment ça Fonctionne ?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                GoogleReviewAI génère et publie automatiquement du contenu optimisé pour l'IA sur votre fiche Google My Business
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Pourquoi Adopter le Local AEO ?
                </h2>
                <p className="text-muted-foreground">
                  Les assistants IA deviennent le nouveau moteur de recherche. Soyez prêt.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 bg-card p-4 rounded-lg border">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 border-0">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-accent fill-accent" />
                    ))}
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Ready à Dominer l'IA Locale ?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Rejoignez les entreprises qui utilisent déjà GoogleReviewAI pour apparaître 
                  dans les réponses de ChatGPT et des autres assistants IA.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto font-semibold">
                      Commencer Maintenant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/select-plan">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Voir les Offres
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Schema moved to Helmet via StructuredData components */}
      </main>

      <Footer />
    </div>
  );
};

export default LocalAEO;
