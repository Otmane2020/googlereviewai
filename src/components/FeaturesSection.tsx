import { Sparkles, Clock, MessageSquare, BarChart3, Globe, Zap, Star, FileText, Bot } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Réponses IA personnalisées",
    description: "L'IA analyse chaque avis et génère une réponse unique, personnalisée au ton de votre marque. Plus de copier-coller !",
  },
  {
    icon: Clock,
    title: "Gain de temps x10",
    description: "Répondez à 100 avis en quelques clics. Ce qui prenait des heures ne prend plus que quelques minutes.",
  },
  {
    icon: Star,
    title: "Améliorez votre note",
    description: "Les clients qui reçoivent une réponse sont 2x plus susceptibles de modifier leur avis positivement.",
  },
];

const capabilities = [
  { icon: MessageSquare, title: "Multi-établissements", description: "Gérez tous vos points de vente depuis un seul tableau de bord" },
  { icon: Sparkles, title: "Ton personnalisable", description: "Formel, décontracté, professionnel... Adaptez le style à votre image" },
  { icon: Globe, title: "SEO AutoPost", description: "Générez des articles optimisés pour améliorer votre référencement local" },
  { icon: FileText, title: "ChatGPT Rank (AEO)", description: "Créez des Q&A pour apparaître dans les réponses des IA comme ChatGPT" },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">Fonctionnalités</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tout ce qu'il faut pour gérer vos avis
          </h2>
          <p className="text-lg text-muted-foreground">
            Une solution complète pour transformer la gestion de votre réputation en ligne en avantage concurrentiel.
          </p>
        </div>

        {/* Main features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 bg-card rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-2 text-center">Et bien plus encore...</h3>
          <p className="text-muted-foreground text-center mb-8">Des outils avancés pour maximiser votre visibilité</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Comment ça marche ?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Connectez votre compte</h4>
              <p className="text-muted-foreground text-sm">Liez votre Google My Business en un clic. Vos établissements sont importés automatiquement.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">L'IA génère les réponses</h4>
              <p className="text-muted-foreground text-sm">Pour chaque avis, une réponse personnalisée est créée selon votre ton et vos préférences.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent-foreground">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Publiez en un clic</h4>
              <p className="text-muted-foreground text-sm">Validez et publiez directement sur Google, ou activez la publication automatique.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
