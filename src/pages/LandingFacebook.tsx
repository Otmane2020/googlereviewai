import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { 
  Zap, Star, Check, ArrowRight, Gift, ShieldCheck, Clock, 
  MessageSquare, TrendingUp, Search, Sparkles, Bot, Users, 
  Play, ChevronRight
} from "lucide-react";
import { Helmet } from "react-helmet";
import { useVisitTracking } from "@/hooks/useVisitTracking";

const TESTIMONIALS = [
  {
    name: "Marc D.",
    business: "Restaurant Le Provençal",
    text: "Depuis Starlinko, je réponds à tous mes avis en 2 minutes au lieu de 30. Mes clients adorent !",
    rating: 5,
  },
  {
    name: "Sarah L.",
    business: "Hôtel Belle Vue",
    text: "Notre note Google est passée de 4.1 à 4.6 en 3 mois grâce aux réponses personnalisées de l'IA.",
    rating: 5,
  },
  {
    name: "Karim B.",
    business: "Auto Services Plus",
    text: "L'essai gratuit m'a convaincu en 2 jours. Le SEO automatique est un game changer.",
    rating: 5,
  },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Réponses IA aux avis",
    desc: "Répondez à chaque avis Google en 1 clic avec une IA qui s'adapte à votre ton",
    color: "primary",
  },
  {
    icon: TrendingUp,
    title: "SEO automatique",
    desc: "Articles optimisés publiés chaque semaine pour booster votre visibilité locale",
    color: "secondary",
  },
  {
    icon: Search,
    title: "Classement Google Maps",
    desc: "Suivez et améliorez votre position sur Google Maps face à vos concurrents",
    color: "accent",
  },
  {
    icon: Bot,
    title: "Optimisation ChatGPT",
    desc: "Soyez recommandé quand vos clients demandent à l'IA où aller",
    color: "primary",
  },
];

const LandingFacebook = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Starlinko - Automatisez vos Avis Google avec l'IA | 2 Mois Gratuits</title>
        <meta name="description" content="Répondez à tous vos avis Google en 1 clic grâce à l'IA. Essai gratuit 2 mois, sans carte bancaire. +500 entreprises utilisent Starlinko." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://starlinko.app/lp/facebook" />
      </Helmet>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <StarlinkoLogo />
          <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
            <Zap className="w-4 h-4" />
            Essai gratuit
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 md:w-80 h-48 md:h-80 bg-card/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 md:w-96 h-64 md:h-96 bg-card/5 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-5 pt-12 sm:pt-16 pb-16 sm:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 backdrop-blur-sm rounded-full border border-accent/30 mb-6 animate-fade-in">
              <Gift className="w-4 h-4 text-accent animate-bounce" />
              <span className="text-card text-sm font-bold">
                🎁 2 mois offerts — Offre limitée
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-card leading-tight mb-5 animate-fade-in">
              Vos avis Google répondus
              <span className="block text-accent-gold mt-2">automatiquement par l'IA</span>
            </h1>

            <p className="text-lg sm:text-xl text-card/85 max-w-xl mx-auto mb-8 leading-relaxed animate-fade-in">
              Starlinko répond à chaque avis en quelques secondes. 
              Plus de temps perdu, plus de clients satisfaits.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-fade-in">
              <Button 
                variant="hero" 
                size="xl" 
                className="gap-2 w-full sm:w-auto text-base"
                onClick={() => navigate("/auth")}
              >
                <Gift className="w-5 h-5" />
                Démarrer 2 mois gratuits
              </Button>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-card/80 text-sm animate-fade-in">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-secondary" />
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-secondary" />
                Annulation à tout moment
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-accent fill-accent" />
                4.8/5 sur TrustAvis
              </span>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Social Proof Counter */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-5">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary">+500</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Entreprises actives</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-2xl sm:text-3xl font-bold text-secondary">50k+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Avis traités</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-accent-foreground">4.8★</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Note moyenne</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 bg-muted/30">
        <div className="container mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-10">
            Tout ce dont votre entreprise a besoin
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {FEATURES.map((f, idx) => (
              <div key={idx} className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-lg bg-${f.color}/10 flex items-center justify-center flex-shrink-0`}>
                  <f.icon className={`w-5 h-5 text-${f.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-3">
            Ils nous font confiance
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Rejoignez +500 entreprises qui automatisent leur présence en ligne
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="p-5 bg-card rounded-xl border border-border">
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-card/5 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-5 text-center">
          <div className="max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full mb-6">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-card text-sm font-bold">Offre limitée — 2 mois gratuits</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-card mb-4">
              Prêt à automatiser vos avis Google ?
            </h2>
            <p className="text-card/80 mb-8">
              Commencez votre essai gratuit de 2 mois maintenant. Aucune carte bancaire requise.
            </p>

            <Button 
              variant="hero" 
              size="xl" 
              className="gap-2 w-full sm:w-auto text-base"
              onClick={() => navigate("/auth")}
            >
              <Gift className="w-5 h-5" />
              Démarrer maintenant — C'est gratuit
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-card/70 text-xs">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Paiement sécurisé
              </span>
              <span>•</span>
              <span>Annulation en 1 clic</span>
              <span>•</span>
              <span>Support prioritaire</span>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-6 bg-card border-t border-border">
        <div className="container mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <StarlinkoLogo />
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="/terms" className="hover:text-foreground transition-colors">CGU</a>
          </div>
          <span>© 2025 Starlinko</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingFacebook;
