import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, TrendingUp, Bot, Zap } from "lucide-react";

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
          Prêt à dominer votre marché local ?
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-card/80 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
          Rejoignez des centaines d'entreprises qui utilisent Starlinko pour devancer leurs concurrents.
        </p>
        
        {/* Benefits - Mobile optimized */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-10 text-card/90 text-sm">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold" />
            <span>Visibilité ChatGPT</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            <span>SEO AutoPost</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            <span>Réponses IA</span>
          </div>
        </div>
        
        <Button 
          variant="hero" 
          size="xl" 
          className="gap-2 sm:gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto text-sm sm:text-base" 
          onClick={() => navigate("/auth")}
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          Démarrer mon essai gratuit
        </Button>
        <p className="text-card/60 text-xs sm:text-sm mt-3 sm:mt-4">14 jours gratuits • Sans carte bancaire</p>
      </div>
    </section>
  );
};
