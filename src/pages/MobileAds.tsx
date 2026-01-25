import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Zap, Check, Shield, Clock } from "lucide-react";
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

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        {/* 5 Stars */}
        <div className="flex items-center gap-0.5 mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 leading-tight max-w-sm">
          Répondez à vos avis Google avec <span className="text-primary">l'IA</span>
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground text-lg mb-8 max-w-xs">
          Gagnez du temps. Améliorez votre réputation.
        </p>

        {/* CTA Button */}
        <Button 
          size="xl" 
          onClick={handleSignup}
          className="w-full max-w-xs gap-2 text-lg h-14 rounded-2xl shadow-lg"
        >
          <Zap className="w-5 h-5" />
          Créer mon compte gratuit
        </Button>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-muted-foreground text-sm">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-primary" />
            3 jours gratuits
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" />
            Sans CB
          </span>
        </div>

        {/* Social Proof */}
        <div className="mt-10 pt-6 border-t border-border/50 w-full max-w-xs">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-primary text-xs font-bold shadow-sm"
                style={{ marginLeft: i > 1 ? '-10px' : '0' }}
              >
                {['JD', 'ML', 'SA', 'PR', 'LC'][i - 1]}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">+2000</span> entreprises nous font confiance
          </p>
        </div>
      </main>

      {/* Testimonial */}
      <footer className="px-6 pb-8">
        <div className="bg-muted/50 rounded-2xl p-4 max-w-sm mx-auto">
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <p className="text-foreground text-sm italic">
            "Gain de temps incroyable !"
          </p>
          <p className="text-muted-foreground text-xs mt-1">— Marie L., Paris</p>
        </div>
      </footer>
    </div>
  );
};

export default MobileAds;
