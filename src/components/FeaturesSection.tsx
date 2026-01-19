import { Sparkles, Clock, MessageSquare, Globe, Zap, Star, FileText, Bot } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Réponses IA personnalisées",
    description: "L'IA analyse chaque avis et génère une réponse unique au ton de votre marque.",
  },
  {
    icon: Clock,
    title: "Gain de temps x10",
    description: "Répondez à 100 avis en quelques clics. Ce qui prenait des heures ne prend plus que quelques minutes.",
  },
  {
    icon: Star,
    title: "Améliorez votre note",
    description: "Les clients qui reçoivent une réponse sont 2x plus susceptibles de modifier leur avis.",
  },
];

const capabilities = [
  { icon: MessageSquare, title: "Multi-établissements", description: "Gérez tous vos points de vente depuis un seul tableau de bord" },
  { icon: Sparkles, title: "Ton personnalisable", description: "Formel, décontracté, professionnel... Adaptez le style" },
  { icon: Globe, title: "SEO AutoPost", description: "Articles optimisés pour le référencement local" },
  { icon: FileText, title: "ChatGPT Rank", description: "Q&A pour apparaître dans les réponses IA" },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-primary text-xs sm:text-sm font-medium">Fonctionnalités</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Tout ce qu'il faut pour gérer vos avis
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            Une solution complète pour transformer votre réputation en avantage concurrentiel.
          </p>
        </div>

        {/* Main features - Mobile cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 md:mb-20">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-5 sm:p-6 md:p-8 bg-card rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Capabilities - Mobile optimized grid */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-center">Et bien plus encore...</h3>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-8">Des outils avancés pour maximiser votre visibilité</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="bg-card p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 sm:mb-4">
                  <item.icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{item.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works - Mobile optimized */}
        <div className="mt-12 sm:mt-16 md:mt-20">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 text-center">Comment ça marche ?</h3>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Connectez votre compte</h4>
              <p className="text-muted-foreground text-xs sm:text-sm px-2">Liez votre Google My Business en un clic.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-secondary">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">L'IA génère les réponses</h4>
              <p className="text-muted-foreground text-xs sm:text-sm px-2">Réponse personnalisée selon vos préférences.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-accent-foreground">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Publiez en un clic</h4>
              <p className="text-muted-foreground text-xs sm:text-sm px-2">Publication directe ou automatique sur Google.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
