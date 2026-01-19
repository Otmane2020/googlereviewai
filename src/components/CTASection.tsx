import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, Clock, Shield } from "lucide-react";

export const CTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 sm:py-20 md:py-24 gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 w-40 sm:w-60 h-40 sm:h-60 bg-card/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 sm:-bottom-20 sm:-left-20 w-52 sm:w-80 h-52 sm:h-80 bg-card/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-5 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-card mb-4 sm:mb-6 px-2">
          Prêt à automatiser vos réponses ?
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-card/80 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
          Rejoignez des centaines d'entreprises qui utilisent Starlinko pour gérer leurs avis Google.
        </p>
        
        {/* Benefits - Mobile optimized */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-10 text-card/90 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold" />
            <span>Réponses IA personnalisées</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            <span>Gain de temps x10</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            <span>API Google vérifiée</span>
          </div>
        </div>
        
        <Button 
          variant="hero" 
          size="xl" 
          className="gap-2 sm:gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto text-sm sm:text-base" 
          onClick={() => navigate("/auth")}
        >
          <GoogleIcon />
          Démarrer mon essai gratuit
        </Button>
        <p className="text-card/60 text-xs sm:text-sm mt-3 sm:mt-4">14 jours gratuits • Sans carte bancaire</p>
      </div>
    </section>
  );
};

const GoogleIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
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
