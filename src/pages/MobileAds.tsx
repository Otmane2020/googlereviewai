import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Zap, Check, MessageSquare, TrendingUp, Clock, Sparkles } from "lucide-react";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";

const MobileAds = () => {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate("/auth?redirect=/choose-plan&from=ads");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="py-4 px-4">
        <div className="flex justify-center">
          <StarlinkoLogo className="h-8" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
        {/* 5 Stars Badge */}
        <div className="inline-flex items-center gap-0.5 bg-primary/10 px-3 py-1.5 rounded-full mb-5">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          ))}
          <span className="text-xs font-medium text-foreground ml-2">+2000 entreprises</span>
        </div>

        {/* Headline - Pain Point First */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4 leading-tight max-w-sm">
          Ne perdez plus de clients à cause des <span className="text-destructive">avis non répondus</span>
        </h1>

        {/* Subheadline - Solution */}
        <p className="text-muted-foreground text-base mb-6 max-w-xs leading-relaxed">
          Starlinko répond <span className="font-semibold text-foreground">automatiquement</span> à vos avis Google avec l'IA et améliore votre visibilité locale.
        </p>

        {/* CTA Button */}
        <Button 
          size="xl" 
          onClick={handleSignup}
          className="w-full max-w-xs gap-2 text-base h-14 rounded-2xl shadow-lg mb-4"
        >
          <Zap className="w-5 h-5" />
          Essayer Starlinko gratuitement
        </Button>

        {/* Trust Indicators - Right after CTA */}
        <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm mb-6">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-primary" />
            3 jours gratuits
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-primary" />
            Sans CB
          </span>
        </div>

        {/* Social Proof - Close to CTA */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-primary text-xs font-bold shadow-sm"
              style={{ marginLeft: i > 1 ? '-10px' : '0' }}
            >
              {['JD', 'ML', 'SA', 'PR', 'LC'][i - 1]}
            </div>
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            <span className="font-semibold text-foreground">+2000</span> pros
          </span>
        </div>

        {/* Why Starlinko - 4 bullets max */}
        <div className="w-full max-w-xs bg-muted/50 rounded-2xl p-4 text-left">
          <p className="text-sm font-semibold text-foreground mb-3 text-center">
            🧠 Pourquoi Starlinko ?
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Réponses auto aux avis Google</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Ton pro et personnalisé</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Meilleur SEO local</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Mise en place en 2 min</span>
            </div>
          </div>
        </div>
      </main>

      {/* Testimonial */}
      <footer className="px-5 pb-6">
        <div className="bg-card border border-border rounded-2xl p-4 max-w-xs mx-auto shadow-sm">
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <p className="text-foreground text-sm">
            "Gain de temps incroyable, mes clients sont ravis !"
          </p>
          <p className="text-muted-foreground text-xs mt-1">— Marie L., Restaurant Paris</p>
        </div>
      </footer>
    </div>
  );
};

export default MobileAds;
