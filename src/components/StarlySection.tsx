import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Check, Clock, Shield, Zap, ArrowRight } from "lucide-react";
import starlyRobot from "@/assets/starly-robot.png";

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const StarlySection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image côté gauche */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" />
            <div className="relative">
              <img 
                src={starlyRobot} 
                alt="Starly - Robot IA pour avis Google" 
                className="w-full max-w-md mx-auto lg:mx-0 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Contenu côté droit */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-primary text-sm font-medium">Assistant IA Officiel</span>
            </div>

            {/* Titre */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Rencontrez{" "}
              <span className="text-primary">Starly</span>
            </h2>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 max-w-lg mx-auto lg:mx-0">
              Votre robot officiel qui gère vos avis Google <strong className="text-foreground">24h/24, 7j/7</strong>. 
              Recrutez Starly et gagnez en tranquillité !
            </p>

            {/* Avantages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold text-sm">Disponible 24/7</p>
                  <p className="text-muted-foreground text-xs">Ne dort jamais</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold text-sm">Ultra rapide</p>
                  <p className="text-muted-foreground text-xs">Répond en secondes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <GoogleIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold text-sm">Expert Google</p>
                  <p className="text-muted-foreground text-xs">Spécialisé avis</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold text-sm">100% fiable</p>
                  <p className="text-muted-foreground text-xs">Pas d'erreurs</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button 
                variant="default" 
                size="xl" 
                className="gap-2"
                onClick={() => navigate("/auth")}
              >
                <Zap className="w-5 h-5" />
                Recruter Starly
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Trust */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-5 text-muted-foreground text-xs">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                Essai gratuit 3 jours
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                Sans engagement
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
