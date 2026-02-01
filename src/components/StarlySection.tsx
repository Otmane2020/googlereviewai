import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Check, Clock, Shield, Zap, ArrowRight, Star } from "lucide-react";
import starlyLogo from "@/assets/starly-logo.png";
import starlyAction from "@/assets/starly-action.png";

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
        {/* Header central */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="text-primary text-sm font-medium">Assistant IA Officiel</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Rencontrez <span className="text-primary">Starly</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Votre robot officiel qui gère vos avis Google <strong className="text-foreground">24h/24, 7j/7</strong>. 
            Recrutez Starly et gagnez en tranquillité !
          </p>
        </div>

        {/* Deux rubriques côte à côte */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Rubrique 1: Qui est Starly */}
          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <img 
              src={starlyLogo} 
              alt="Starly - Assistant IA" 
              className="w-48 sm:w-56 mb-6 relative z-10"
            />
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              Qui est Starly ?
            </h3>
            <p className="text-muted-foreground mb-6">
              Starly est votre assistant IA dédié, conçu pour gérer automatiquement tous vos avis Google avec intelligence et réactivité.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">Disponible 24/7</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                <Zap className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-foreground">Ultra rapide</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">100% fiable</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                <Star className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-foreground">Personnalisé</span>
              </div>
            </div>
          </div>

          {/* Rubrique 2: Ce que fait Starly */}
          <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/5 rounded-full blur-3xl" />
            <img 
              src={starlyAction} 
              alt="Starly gère vos avis Google" 
              className="w-56 sm:w-64 mb-6 relative z-10"
            />
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              Ce que fait Starly
            </h3>
            <p className="text-muted-foreground mb-6">
              Starly répond à chaque avis avec le bon ton, améliore votre e-réputation et vous fait gagner un temps précieux.
            </p>
            <div className="space-y-2 w-full text-left">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm text-foreground">Répond à tous vos avis Google automatiquement</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-foreground">Analyse le sentiment et adapte le ton</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-foreground">Publie directement sur Google Business</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA central */}
        <div className="text-center mt-10 sm:mt-12">
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
          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-muted-foreground text-xs">
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
    </section>
  );
};
