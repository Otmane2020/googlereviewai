import { useEffect } from "react";
import { Star } from "lucide-react";

export const TrustAvisLabel = ({ className = "" }: { className?: string }) => {
  return (
    <a
      href="https://trust-avis.com/entreprise/starlinko"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <div className="w-5 h-5 bg-[#3B82F6] rounded-md flex items-center justify-center">
        <Star className="w-3 h-3 text-white fill-white" />
      </div>
      <span className="text-sm font-medium">
        <span className="text-foreground">Trust</span>
        <span className="text-[#3B82F6]">Avis</span>
      </span>
    </a>
  );
};

export const TrustAvisBadge = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://trust-avis.com/widgets/badge.js";
    script.setAttribute("data-business", "googlereviewai.com");
    script.setAttribute("data-theme", "light");
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div id="trustavis-badge" />;
};

export const TrustAvisCarousel = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://trust-avis.com/widgets/carousel.js";
    script.setAttribute("data-business", "googlereviewai.com");
    script.setAttribute("data-theme", "light");
    script.setAttribute("data-count", "3");
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div id="trustavis-carousel" className="w-full" />;
};

export const TrustAvisMiniRating = () => {
  return (
    <a
      href="https://trust-avis.com/entreprise/starlinko"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm"
    >
      <span className="w-5 h-5 bg-secondary rounded flex items-center justify-center text-secondary-foreground font-bold text-xs">
        T
      </span>
      <span className="text-accent">★★★★★</span>
      <span className="text-muted-foreground text-xs sm:text-sm">4.8 (60 avis)</span>
    </a>
  );
};
