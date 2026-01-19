import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Check, Sparkles, Star, Clock, TrendingUp, Zap } from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-card/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-card/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-card/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/10 backdrop-blur-sm rounded-full border border-card/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-card text-sm font-medium">
              Réponses automatiques par IA • Gagnez 10h/semaine
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-tight mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Transformez vos avis Google
            <span className="block text-accent-gold mt-2">en avantage concurrentiel</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-card/80 max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Répondez automatiquement à tous vos avis Google My Business grâce à l'IA. 
            Améliorez votre réputation, fidélisez vos clients et boostez votre SEO local.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="gap-3" onClick={() => navigate("/auth")}>
              <Zap className="w-5 h-5" />
              Essai gratuit 14 jours
            </Button>
            <Button variant="outline" size="xl" className="gap-2 bg-card/10 border-card/30 text-card hover:bg-card/20" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Voir les fonctionnalités
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <Clock className="w-6 h-6 text-accent" />
                -90%
              </div>
              <p className="text-card/70 text-sm">Temps de réponse</p>
            </div>
            <div className="text-center border-x border-card/20">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <Star className="w-6 h-6 text-accent-gold fill-accent-gold" />
                +0.5
              </div>
              <p className="text-card/70 text-sm">Note moyenne</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <TrendingUp className="w-6 h-6 text-secondary" />
                +40%
              </div>
              <p className="text-card/70 text-sm">Visibilité locale</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-card/80 text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-secondary" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-secondary" />
              <span>Configuration en 2 min</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-secondary" />
              <span>+500 entreprises</span>
            </div>
          </div>
        </div>

        {/* Demo Preview */}
        <div className="mt-16 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="bg-card/10 backdrop-blur-lg rounded-2xl border border-card/20 p-4 shadow-2xl">
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">Marie D.</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-accent fill-accent" />)}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    "Service impeccable ! L'équipe est très professionnelle et à l'écoute. Je recommande vivement."
                  </p>
                </div>
              </div>
              <div className="ml-14 p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Réponse générée par IA</span>
                </div>
                <p className="text-sm text-foreground">
                  "Merci beaucoup Marie pour ce retour chaleureux ! 🙏 Nous sommes ravis que notre service ait été à la hauteur de vos attentes. Votre satisfaction est notre priorité. À très bientôt !"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};
