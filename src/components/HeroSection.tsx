import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Shield, Check, Rocket, Star, MessageSquare, TrendingUp } from "lucide-react";

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
            <Shield className="w-4 h-4 text-card" />
            <span className="text-card text-sm font-medium">
              Application vérifiée Google API • Conforme aux politiques
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card leading-tight mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Connectez vos avis Google My Business
            <span className="block text-accent-gold mt-2">avec accès API vérifié</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-card/80 max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Starlinko est une application vérifiée avec accès complet à l'API Google My Business. 
            Gérez et répondez automatiquement à vos avis en toute conformité.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="gap-3" onClick={() => navigate("/auth")}>
              <GoogleIcon />
              Commencer gratuitement
            </Button>
            <Button variant="outline" size="xl" className="gap-2 bg-card/10 border-card/30 text-card hover:bg-card/20" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              En savoir plus
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <Star className="w-6 h-6 text-accent-gold fill-accent-gold" />
                4.9
              </div>
              <p className="text-card/70 text-sm">Note moyenne</p>
            </div>
            <div className="text-center border-x border-card/20">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <MessageSquare className="w-6 h-6 text-secondary" />
                10k+
              </div>
              <p className="text-card/70 text-sm">Avis gérés</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-card mb-1">
                <TrendingUp className="w-6 h-6 text-accent" />
                98%
              </div>
              <p className="text-card/70 text-sm">Satisfaction</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-card/80 text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-secondary" />
              <span>Application vérifiée</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              <span>Conforme aux politiques Google</span>
            </div>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-secondary" />
              <span>14 jours d'essai gratuit</span>
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

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);
