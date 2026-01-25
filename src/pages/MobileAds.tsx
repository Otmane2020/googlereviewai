import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Zap, Check, MessageSquare, TrendingUp, Clock, Sparkles, Gift } from "lucide-react";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { TrustAvisLabel } from "@/components/TrustAvisBadge";

const MobileAds = () => {
  const navigate = useNavigate();

  const handleSignup = () => {
    // Track LinkedIn conversion for signup
    if (typeof window !== 'undefined' && (window as any).lintrk) {
      (window as any).lintrk('track', { conversion_id: 21122002 });
    }
    navigate("/auth?redirect=/choose-plan&from=ads");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="py-4 px-4">
        <div className="flex items-center justify-center gap-4">
          <StarlinkoLogo className="h-8" />
          <div className="h-5 w-px bg-border" />
          <TrustAvisLabel />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
        {/* Launch Offer Badge */}
        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4 shadow-lg">
          <Gift className="w-4 h-4" />
          Offre de lancement – -20% sur le 1er mois
        </div>

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

        {/* Subheadline - Solution + Résultat */}
        <p className="text-muted-foreground text-base mb-6 max-w-xs leading-relaxed">
          Starlinko répond <span className="font-semibold text-foreground">automatiquement</span> à vos avis Google avec l'IA pour renforcer la confiance et attirer plus de clients.
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

        {/* Trust Indicators + Offer */}
        <div className="flex flex-col items-center gap-2 text-sm mb-6">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              3 jours gratuits
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              Sans CB
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-amber-600 font-medium">
            <Gift className="w-4 h-4" />
            -20% réservé aux nouveaux comptes
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

        {/* Why Starlinko - Optimized order */}
        <div className="w-full max-w-xs bg-muted/50 rounded-2xl p-4 text-left">
          <p className="text-sm font-semibold text-foreground mb-3 text-center">
            🧠 Pourquoi Starlinko ?
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Réponses automatiques aux avis Google</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Ton professionnel et personnalisé</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Plus de visibilité et confiance locale</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">Mise en place en 2 minutes</span>
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
        
        {/* TrustAvis Rating - Bottom Right */}
        <div className="flex justify-end mt-4 pr-1">
          <a
            href="https://trust-avis.com/entreprise/starlinko"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <div className="w-4 h-4 bg-[#3B82F6] rounded flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-white fill-white" />
            </div>
            <span className="font-medium">
              <span className="text-foreground">Trust</span>
              <span className="text-[#3B82F6]">Avis</span>
            </span>
            <span className="text-muted-foreground">4.8</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default MobileAds;
