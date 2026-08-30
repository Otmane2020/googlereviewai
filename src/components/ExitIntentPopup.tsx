import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Star, Zap, X, Clock, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "googlereviewai.com_exit_popup_shown";
const COOLDOWN_HOURS = 24;

export const ExitIntentPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const shouldShowPopup = useCallback(() => {
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (!lastShown) return true;
    const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
    return hoursSince >= COOLDOWN_HOURS;
  }, []);

  useEffect(() => {
    if (!shouldShowPopup()) return;

    let triggered = false;

    // Desktop: mouse leaves viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !triggered) {
        triggered = true;
        setIsOpen(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    };

    // Mobile: back button / scroll up fast
    let lastScrollY = window.scrollY;
    let scrollUpCount = 0;
    const handleScroll = () => {
      if (window.scrollY < lastScrollY && window.scrollY < 100) {
        scrollUpCount++;
        if (scrollUpCount > 3 && !triggered) {
          triggered = true;
          setIsOpen(true);
          localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }
      } else {
        scrollUpCount = 0;
      }
      lastScrollY = window.scrollY;
    };

    // Delay listeners to avoid triggering immediately
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [shouldShowPopup]);

  const handleCTA = () => {
    setIsOpen(false);
    navigate("/auth");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0 rounded-2xl">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-secondary p-6 text-center relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-white animate-bounce" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Attendez ! 🎁
          </h2>
          <p className="text-white/90 text-sm">
            Profitez de notre offre exclusive avant de partir
          </p>
        </div>

        {/* Content */}
        <div className="p-6 bg-card">
          {/* Offer */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-5 text-center">
            <p className="text-sm text-muted-foreground mb-1">Offer spéciale</p>
            <p className="text-3xl font-bold text-foreground">2 mois GRATUITS</p>
            <p className="text-sm text-muted-foreground mt-1">
              Essayez GoogleReviewAI sans risque pendant 60 jours
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-3 mb-5">
            <li className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground">Responses IA illimitées à vos avis Google</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-foreground">Articles SEO générés automatiquement</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="text-foreground">Annulation gratuite à tout moment</span>
            </li>
          </ul>

          {/* CTA */}
          <Button onClick={handleCTA} className="w-full" size="lg">
            <Gift className="w-5 h-5 mr-2" />
            Démarrer mes 2 mois gratuits
          </Button>

          {/* Trust */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sans engagement
            </span>
            <span>•</span>
            <span>Paiement sécurisé</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              4.8/5
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Non merci, je reviendrai plus tard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
