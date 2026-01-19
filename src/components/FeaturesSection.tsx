import { Sparkles, Clock, MessageSquare, Zap, FileText, TrendingUp, ArrowRight, MessageCircle, Eye, X, Pen, Target, Brain } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

const ChatGPTIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const features = [
  {
    icon: MessageCircle,
    title: "Réponses aux avis par IA",
    subtitle: "Répondez à 100 avis en 1 clic",
    description: "L'IA génère des réponses personnalisées et professionnelles pour chaque avis client en quelques secondes.",
    badge: "Populaire",
    badgeColor: "bg-accent text-accent-foreground",
    details: {
      title: "Réponses aux avis par IA",
      description: "Notre intelligence artificielle analyse le contenu et le sentiment de chaque avis pour générer des réponses personnalisées, professionnelles et authentiques.",
      benefits: [
        "Réponses contextuelles adaptées au contenu de l'avis",
        "Ton personnalisable selon votre marque",
        "Publication en 1 clic sur Google",
        "Gain de temps : 100 avis traités en quelques minutes"
      ]
    }
  },
  {
    icon: Pen,
    title: "SEO AutoPost",
    subtitle: "Articles optimisés générés",
    description: "Articles SEO générés automatiquement pour dominer les recherches locales et attirer plus de clients.",
    badge: "Nouveau",
    badgeColor: "bg-secondary text-secondary-foreground",
    details: {
      title: "SEO AutoPost",
      description: "Générez automatiquement des articles de blog optimisés pour le référencement local. Chaque article est conçu pour attirer du trafic qualifié.",
      benefits: [
        "Articles optimisés pour les mots-clés locaux",
        "Contenu unique et pertinent pour votre secteur",
        "Amélioration du positionnement Google",
        "Publication automatique programmable"
      ]
    }
  },
  {
    icon: Eye,
    title: "Visibilité ChatGPT",
    subtitle: "Apparaissez dans les réponses IA",
    description: "Créez des Q&A optimisés pour apparaître dans les réponses de ChatGPT, Perplexity et autres IA.",
    badge: "Exclusif",
    badgeColor: "bg-primary text-primary-foreground",
    details: {
      title: "Visibilité ChatGPT (AEO)",
      description: "L'Answer Engine Optimization (AEO) vous permet d'être cité directement dans les réponses des IA comme ChatGPT, Perplexity ou Google AI.",
      benefits: [
        "Questions-réponses optimisées pour les IA",
        "Positionnement sur les requêtes conversationnelles",
        "Nouvelle source de trafic qualifié",
        "Avantage concurrentiel durable"
      ]
    }
  },
];

const capabilities = [
  { 
    icon: TrendingUp, 
    title: "Devancez vos concurrents", 
    description: "Soyez visible là où ils ne sont pas encore",
    stat: "+40%",
  },
  { 
    icon: MessageSquare, 
    title: "Multi-établissements", 
    description: "Gérez tous vos points de vente",
    stat: "∞",
  },
  { 
    icon: Sparkles, 
    title: "Ton personnalisable", 
    description: "Adaptez le style à votre marque",
    stat: "100%",
  },
  { 
    icon: Clock, 
    title: "Gain de temps", 
    description: "Automatisez tout le processus",
    stat: "x10",
  },
];

const steps = [
  {
    num: "1",
    title: "Connectez-vous",
    description: "Liez votre Google My Business en un clic avec votre compte Google.",
    icon: "🔗",
  },
  {
    num: "2",
    title: "L'IA travaille",
    description: "Starlinko génère automatiquement des réponses personnalisées.",
    icon: "✨",
  },
  {
    num: "3",
    title: "Publiez",
    description: "Validez et publiez en un clic, ou activez le mode automatique.",
    icon: "🚀",
  },
];

export const FeaturesSection = () => {
  const [openDialog, setOpenDialog] = useState<number | null>(null);

  return (
    <section id="features" className="py-14 sm:py-20 md:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-5">
            <ChatGPTIcon className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs sm:text-sm font-semibold">SEO + AEO + IA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Devancez vos concurrents
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Visibilité Google, ChatGPT, et satisfaction client. Tout en un.
          </p>
        </div>

        {/* Main features - Cards with light background */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-5 sm:p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
              onClick={() => setOpenDialog(index)}
            >
              {/* Badge */}
              <span className={`absolute top-4 right-4 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                {feature.badge}
              </span>
              
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-primary font-medium mb-2">{feature.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              
              {/* Learn more button */}
              <button className="mt-4 flex items-center gap-1 text-primary text-sm font-medium group-hover:underline transition-all">
                <span>En savoir plus</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        {/* Feature Detail Dialogs */}
        {features.map((feature, index) => (
          <Dialog key={feature.title} open={openDialog === index} onOpenChange={(open) => !open && setOpenDialog(null)}>
            <DialogContent className="sm:max-w-lg bg-card">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <DialogTitle className="text-xl font-bold text-foreground">{feature.details.title}</DialogTitle>
                </div>
                <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                  {feature.details.description}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Avantages clés
                </h4>
                <ul className="space-y-2">
                  {feature.details.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-secondary" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setOpenDialog(null)}>
                  Compris !
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}

        {/* Capabilities with stats */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-border/50">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Pourquoi Starlinko ?</h3>
            <p className="text-muted-foreground text-sm">Les avantages qui font la différence</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all text-center sm:text-left"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-2xl sm:text-xl font-bold text-primary">{item.stat}</span>
                </div>
                <h4 className="font-semibold text-foreground mb-1 text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works - Timeline style for mobile */}
        <div className="mt-12 sm:mt-16">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Comment ça marche ?</h3>
            <p className="text-muted-foreground text-sm">3 étapes simples pour démarrer</p>
          </div>
          
          {/* Mobile: Vertical timeline */}
          <div className="sm:hidden space-y-4">
            {steps.map((step, index) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg">
                    {step.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full min-h-[40px] bg-gradient-to-b from-primary/50 to-secondary/50 my-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <h4 className="font-bold text-foreground mb-1">{step.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop: Horizontal */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                  {step.icon}
                </div>
                <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
