import { useState, useEffect } from "react";
import { Bot, Search, Rocket, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BrandSparkle } from "@/components/BrandSparkle";

const MobileAIDemoSection = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState<"chatgpt" | "google">("chatgpt");
  const [isTyping, setIsTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Auto-switch between demos
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDemo((prev) => (prev === "chatgpt" ? "google" : "chatgpt"));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Typing animation when demo changes
  useEffect(() => {
    setIsTyping(true);
    setShowAnswer(false);
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
      setShowAnswer(true);
    }, 1500);
    return () => clearTimeout(typingTimer);
  }, [activeDemo]);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-5">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1.5">
            <BrandSparkle className="w-3.5 h-3.5 text-primary" />
            Optimisation IA & SEO
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Soyez recommandé par l'IA
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Quand vos clients demandent à ChatGPT ou cherchent sur Google, votre entreprise apparaît en premier
          </p>
        </div>

        {/* Demo Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveDemo("chatgpt")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeDemo === "chatgpt"
                ? "bg-[#10a37f] text-white shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Bot className="w-4 h-4" />
            ChatGPT
          </button>
          <button
            onClick={() => setActiveDemo("google")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeDemo === "google"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Search className="w-4 h-4" />
            Google
          </button>
        </div>

        {/* Mobile Frame */}
        <div className="max-w-xs mx-auto">
          <div className="relative bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-10" />
            
            {/* Screen */}
            <div className="bg-card rounded-[2rem] overflow-hidden min-h-[480px] relative">
              {/* ChatGPT Demo */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  activeDemo === "chatgpt"
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-full"
                }`}
              >
                <div className="p-6 pt-10">
                  {/* ChatGPT Header */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">ChatGPT</span>
                  </div>

                  {/* Chat Bubble - Question */}
                  <div className="flex justify-end mb-4">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md max-w-[85%]">
                      <p className="text-sm font-medium leading-relaxed">
                        Quel est le meilleur restaurant italien à Lyon ?
                      </p>
                    </div>
                  </div>

                  {/* Chat Bubble - Answer */}
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md max-w-[90%]">
                      {isTyping && activeDemo === "chatgpt" ? (
                        <div className="flex gap-1 py-2">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed animate-fade-in">
                          D'après les avis récents et la notoriété, je recommande vivement{" "}
                          <span className="font-bold text-primary">La Trattoria di Marco</span>.
                          <br /><br />
                          Excellente réputation avec une note de 4.8★ sur Google.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Benefit callout */}
                  {showAnswer && activeDemo === "chatgpt" && (
                    <div className="mt-6 p-3 bg-[#10a37f]/10 border border-[#10a37f]/30 rounded-xl animate-fade-in">
                      <p className="text-xs text-center text-[#10a37f] font-medium">
                        ✨ GoogleReviewAI optimise votre présence pour les recommandations IA
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Demo */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  activeDemo === "google"
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-full"
                }`}
              >
                <div className="p-6 pt-10">
                  {/* Google Header */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="text-xl font-medium">
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#EA4335]">o</span>
                      <span className="text-[#FBBC05]">o</span>
                      <span className="text-[#4285F4]">g</span>
                      <span className="text-[#34A853]">l</span>
                      <span className="text-[#EA4335]">e</span>
                    </span>
                    <div className="flex-1 bg-muted rounded-full px-3 py-1.5">
                      <span className="text-xs text-muted-foreground">Restaurant Lyon</span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 space-y-4">
                    {/* Competitor result (faded) */}
                    <div className="opacity-50">
                      <p className="text-xs text-muted-foreground">concurrent-resto.fr</p>
                      <p className="text-sm text-primary font-medium">Restaurant Lyon Centre</p>
                      <div className="h-2 bg-muted rounded w-full mt-1" />
                      <div className="h-2 bg-muted rounded w-3/4 mt-1" />
                    </div>

                    {/* Your site - highlighted */}
                    <div className="p-3 bg-primary/5 border-l-4 border-primary rounded-r-lg animate-fade-in">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs text-primary font-medium">votre-site.com</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Rocket className="w-4 h-4 text-accent" />
                        <p className="text-sm text-primary font-bold">La Trattoria di Marco</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-accent">★★★★★</span>
                        <span className="text-xs text-muted-foreground">4.8 (324 avis)</span>
                      </div>
                      <div className="h-2 bg-muted rounded w-full mt-2" />
                    </div>

                    {/* Third result (faded) */}
                    <div className="opacity-30">
                      <p className="text-xs text-muted-foreground">annuaire-restos.fr</p>
                      <p className="text-sm text-primary/70 font-medium">Liste des restaurants</p>
                      <div className="h-2 bg-muted rounded w-full mt-1" />
                    </div>
                  </div>

                  {/* Benefit callout */}
                  {showAnswer && activeDemo === "google" && (
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-xl animate-fade-in">
                      <p className="text-xs text-center text-primary font-medium">
                        🚀 SEO automatique pour dominer les résultats Google
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => navigate("/auth")}
          >
            Booster ma visibilité
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MobileAIDemoSection;
