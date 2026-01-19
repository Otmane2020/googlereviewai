import { Sparkles, Clock, MessageSquare, Globe, Zap, Star, FileText, Bot, TrendingUp, Search } from "lucide-react";

const ChatGPTIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const features = [
  {
    icon: Bot,
    title: "Réponses IA automatiques",
    description: "L'IA génère des réponses personnalisées pour chaque avis client en quelques secondes.",
  },
  {
    icon: FileText,
    title: "SEO AutoPost",
    description: "Articles optimisés générés automatiquement pour dominer les recherches locales.",
  },
  {
    icon: Search,
    title: "AEO ChatGPT Rank",
    description: "Créez des Q&A pour apparaître dans les réponses de ChatGPT et Perplexity.",
  },
];

const capabilities = [
  { icon: TrendingUp, title: "Devancez vos concurrents", description: "Soyez visible là où ils ne sont pas encore" },
  { icon: MessageSquare, title: "Multi-établissements", description: "Gérez tous vos points de vente" },
  { icon: Sparkles, title: "Ton personnalisable", description: "Adaptez le style à votre marque" },
  { icon: Clock, title: "Gain de temps x10", description: "Automatisez tout le processus" },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6">
            <ChatGPTIcon className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs sm:text-sm font-medium">SEO + AEO + IA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Devancez vos concurrents sur tous les fronts
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            Visibilité Google, ChatGPT, et satisfaction client. Une solution complète.
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
