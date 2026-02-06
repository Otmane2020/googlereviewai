import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, Star, Check, Play, ArrowRight, MessageSquare, TrendingUp, Search } from "lucide-react";

const DEMO_REVIEWS = [
  {
    author: "Sophie M.",
    rating: 5,
    text: "Excellent restaurant, le service est top !",
    response: "Merci Sophie pour ce retour enthousiaste ! Nous sommes ravis que notre service vous ait plu. Au plaisir de vous revoir bientôt !",
  },
  {
    author: "Jean-Pierre L.",
    rating: 4,
    text: "Bonne expérience dans l'ensemble, les plats étaient délicieux.",
    response: "Merci Jean-Pierre pour votre visite ! Heureux que nos plats vous aient régalé. Nous espérons dépasser vos attentes lors de votre prochaine visite !",
  },
  {
    author: "Amina K.",
    rating: 3,
    text: "L'attente était un peu longue mais le repas valait le coup.",
    response: "Merci Amina pour votre avis constructif ! Nous travaillons activement à réduire nos délais d'attente. Votre patience a été récompensée et nous ferons encore mieux !",
  },
];

export const DemoSection = () => {
  const navigate = useNavigate();
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [showResponse, setShowResponse] = useState(false);

  const review = DEMO_REVIEWS[currentDemo];

  // Typewriter effect
  useEffect(() => {
    setShowResponse(false);
    setDisplayedResponse("");
    setIsTyping(false);

    const startTimer = setTimeout(() => {
      setIsTyping(true);
      setShowResponse(true);
      let i = 0;
      const text = review.response;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedResponse(text.substring(0, i + 1));
          i++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }, 800);

    return () => clearTimeout(startTimer);
  }, [currentDemo, review.response]);

  // Auto-cycle demos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % DEMO_REVIEWS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-muted/30" id="demo">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-medium mb-4">
              <Play className="w-3.5 h-3.5" />
              Démo en direct
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
              Voyez Starlinko en action
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Notre IA génère des réponses personnalisées à chaque avis Google en quelques secondes
            </p>
          </div>

          {/* Demo Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              {DEMO_REVIEWS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentDemo(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    idx === currentDemo
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Avis {idx + 1}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {/* Review */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                  {review.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">{review.author}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? "text-accent fill-accent" : "text-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">"{review.text}"</p>
                </div>
              </div>

              {/* AI Response */}
              {showResponse && (
                <div className="ml-0 sm:ml-13 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border-l-4 border-primary animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary">Réponse IA Starlinko</span>
                    {isTyping && (
                      <span className="text-[10px] px-2 py-0.5 bg-secondary/20 text-secondary rounded-full font-medium animate-pulse">
                        Rédaction...
                      </span>
                    )}
                    {!isTyping && (
                      <span className="text-[10px] px-2 py-0.5 bg-secondary/20 text-secondary rounded-full font-medium">
                        ✓ Publiée
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    "{displayedResponse}
                    {isTyping && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats below demo */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-card rounded-xl border border-border">
              <MessageSquare className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">-95%</p>
              <p className="text-xs text-muted-foreground">Temps de réponse</p>
            </div>
            <div className="text-center p-4 bg-card rounded-xl border border-border">
              <TrendingUp className="w-5 h-5 text-secondary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">+40%</p>
              <p className="text-xs text-muted-foreground">Visibilité SEO</p>
            </div>
            <div className="text-center p-4 bg-card rounded-xl border border-border">
              <Search className="w-5 h-5 text-accent-foreground mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">Top 3</p>
              <p className="text-xs text-muted-foreground">Google Maps</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Essayer gratuitement pendant 2 mois
              <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Sans carte bancaire • Annulation à tout moment</p>
          </div>
        </div>
      </div>
    </section>
  );
};
