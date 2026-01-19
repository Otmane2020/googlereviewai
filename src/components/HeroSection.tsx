import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Check, Sparkles, Star, Clock, TrendingUp, Zap, Bot, Search } from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-48 md:w-80 h-48 md:h-80 bg-card/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-64 md:w-96 h-64 md:h-96 bg-card/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-card/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-5 sm:px-6 pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge with Google */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card/10 backdrop-blur-sm rounded-full border border-card/20 mb-6 sm:mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            <span className="text-card text-xs sm:text-sm font-medium">
              IA + SEO + AEO • Devancez vos concurrents
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-tight mb-4 animate-fade-in px-2" style={{ animationDelay: "0.1s" }}>
            Dominez votre marché local
            <span className="block text-accent-gold mt-2">grâce à l'IA</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-card/80 max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-in px-4" style={{ animationDelay: "0.2s" }}>
            Réponses automatiques aux avis, articles SEO générés, et visibilité dans ChatGPT. 
            Tout ce qu'il faut pour surpasser vos concurrents.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 animate-fade-in px-4" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="gap-2 sm:gap-3 w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8" onClick={() => navigate("/auth")}>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              Essai gratuit 14 jours
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="gap-2 bg-card/10 border-card/30 text-card hover:bg-card/20 w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8" 
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Voir les fonctionnalités
            </Button>
          </div>

          {/* Stats - Mobile optimized grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-8 max-w-2xl mx-auto mb-10 sm:mb-12 animate-fade-in px-2" style={{ animationDelay: "0.35s" }}>
            <div className="text-center p-2 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xl sm:text-3xl font-bold text-card mb-1">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-accent hidden sm:block" />
                <span>ChatGPT</span>
              </div>
              <p className="text-card/70 text-xs sm:text-sm">Visibilité AEO</p>
            </div>
            <div className="text-center border-x border-card/20 p-2 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xl sm:text-3xl font-bold text-card mb-1">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent-gold hidden sm:block" />
                <span>+40%</span>
              </div>
              <p className="text-card/70 text-xs sm:text-sm">SEO local</p>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xl sm:text-3xl font-bold text-card mb-1">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-secondary hidden sm:block" />
                <span>#1</span>
              </div>
              <p className="text-card/70 text-xs sm:text-sm">Ranking local</p>
            </div>
          </div>

          {/* Trust badges - Mobile optimized */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 text-card/80 text-xs sm:text-sm animate-fade-in px-4" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              <span>Configuration en 2 min</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              <span>+500 entreprises</span>
            </div>
          </div>
        </div>

        {/* Demo Preview - Mobile optimized */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto animate-fade-in px-2" style={{ animationDelay: "0.5s" }}>
          <div className="bg-card/10 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-card/20 p-3 sm:p-4 shadow-2xl">
            <div className="bg-card rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-base sm:text-lg">👤</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm sm:text-base">Marie D.</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-accent fill-accent" />)}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    "Service impeccable ! L'équipe est très professionnelle et à l'écoute."
                  </p>
                </div>
              </div>
              <div className="ml-0 sm:ml-14 p-3 sm:p-4 bg-primary/5 rounded-lg sm:rounded-xl border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Réponse générée par IA</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  "Merci beaucoup Marie pour ce retour chaleureux ! 🙏 Votre satisfaction est notre priorité. À très bientôt !"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};
