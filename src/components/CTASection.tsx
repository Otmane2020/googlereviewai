import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, TrendingUp, Bot, Zap, Check, ArrowRight } from "lucide-react";

export const CTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-14 sm:py-20 md:py-24 gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 w-40 sm:w-60 h-40 sm:h-60 bg-card/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 sm:-bottom-20 sm:-left-20 w-52 sm:w-80 h-52 sm:h-80 bg-card/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-5 sm:px-6">
        {/* Mobile: Card style */}
        <div className="bg-card/10 backdrop-blur-lg rounded-2xl border border-card/20 p-6 sm:p-10 max-w-3xl mx-auto">
          <div className="text-center">
            <span className="text-4xl mb-4 block">🚀</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-card mb-4">
              Prêt à dominer votre marché ?
            </h2>
            <p className="text-card/80 text-sm sm:text-base mb-6 max-w-xl mx-auto">
              Rejoignez +500 entreprises qui utilisent Starlinko pour devancer leurs concurrents.
            </p>
            
            {/* Benefits list - Mobile optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="flex items-center gap-3 p-3 bg-card/10 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-card font-semibold text-sm">ChatGPT</p>
                  <p className="text-card/60 text-xs">Visibilité AEO</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card/10 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="text-card font-semibold text-sm">SEO</p>
                  <p className="text-card/60 text-xs">Articles auto</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card/10 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-card font-semibold text-sm">IA</p>
                  <p className="text-card/60 text-xs">Réponses auto</p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="hero" 
              size="xl" 
              className="gap-2 w-full sm:w-auto min-w-[250px]" 
              onClick={() => navigate("/auth")}
            >
              <Zap className="w-5 h-5" />
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-card/70 text-xs">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                14 jours gratuits
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-secondary" />
                Annulation facile
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
