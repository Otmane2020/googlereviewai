import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Check, Sparkles, Star, TrendingUp, Zap, Bot, Search, FileText, MessageSquare, Rocket, User } from "lucide-react";

const ChatGPTIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

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

      <div className="relative container mx-auto px-5 sm:px-6 pt-20 sm:pt-24 md:pt-28 pb-12 md:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/10 backdrop-blur-sm rounded-full border border-card/20 mb-6 animate-fade-in">
            <Rocket className="w-4 h-4 text-accent" />
            <span className="text-card text-xs sm:text-sm font-medium">
              Devancez vos concurrents
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-tight mb-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Dominez votre marché local
            <span className="block text-accent-gold mt-2">grâce à l'IA</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-card/85 max-w-2xl mx-auto mb-8 animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Réponses automatiques aux avis, articles SEO générés, et visibilité dans ChatGPT.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto" onClick={() => navigate("/auth")}>
              <Zap className="w-5 h-5" />
              Essai gratuit 14 jours
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="gap-2 bg-card/10 border-card/30 text-card hover:bg-card/20 w-full sm:w-auto" 
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Découvrir
            </Button>
          </div>

          {/* Mobile Feature Cards - Show on mobile only */}
          <div className="grid grid-cols-1 gap-3 mb-8 sm:hidden animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold text-sm">Réponses aux avis par IA</p>
                <p className="text-muted-foreground text-xs">Répondez à 100 avis en 1 clic</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold text-sm">SEO AutoPost</p>
                <p className="text-muted-foreground text-xs">Articles optimisés générés</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <ChatGPTIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold text-sm">Visibilité ChatGPT</p>
                <p className="text-muted-foreground text-xs">Apparaissez dans les réponses IA</p>
              </div>
            </div>
          </div>

          {/* Desktop Stats - Hide on mobile */}
          <div className="hidden sm:grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <Bot className="w-6 h-6 text-accent" />
                <span>ChatGPT</span>
              </div>
              <p className="text-card/70 text-sm">Visibilité AEO</p>
            </div>
            <div className="text-center border-x border-card/20">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <TrendingUp className="w-6 h-6 text-accent-gold" />
                <span>+40%</span>
              </div>
              <p className="text-card/70 text-sm">SEO local</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <Search className="w-6 h-6 text-secondary" />
                <span>#1</span>
              </div>
              <p className="text-card/70 text-sm">Ranking local</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-card/80 text-xs sm:text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary" />
              <span>2 min pour démarrer</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary" />
              <span>+500 entreprises</span>
            </div>
          </div>
        </div>

        {/* Demo Preview */}
        <div className="mt-10 sm:mt-14 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="bg-card/10 backdrop-blur-lg rounded-2xl border border-card/20 p-3 sm:p-4 shadow-2xl">
            <div className="bg-card rounded-xl p-4 sm:p-6 shadow-lg">
              {/* Review */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">Marie D.</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-accent fill-accent" />)}
                    </div>
                    <span className="text-xs text-muted-foreground">il y a 2h</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    "Service impeccable ! L'équipe est très professionnelle et à l'écoute. Je recommande vivement."
                  </p>
                </div>
              </div>
              
              {/* AI Response */}
              <div className="ml-0 sm:ml-13 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-primary">Réponse générée par Starlinko IA</span>
                  <span className="text-[10px] px-2 py-0.5 bg-secondary/20 text-secondary rounded-full font-medium">Auto</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  "Merci beaucoup Marie pour ce retour chaleureux ! Nous sommes ravis que notre service ait été à la hauteur de vos attentes. Votre satisfaction est notre priorité. À très bientôt !"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 100L60 92C120 84 240 68 360 60C480 52 600 52 720 56C840 60 960 68 1080 72C1200 76 1320 76 1380 76L1440 76V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};
