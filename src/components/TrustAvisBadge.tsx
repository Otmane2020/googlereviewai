import { useEffect } from "react";

export const TrustAvisBadge = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://trust-avis.com/widgets/badge.js";
    script.setAttribute("data-business", "starlinko");
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
    script.setAttribute("data-business", "starlinko");
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
