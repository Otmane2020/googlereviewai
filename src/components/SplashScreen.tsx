import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo - Star jaune avec point vert */}
        <div className="relative">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent/10 to-secondary/10 flex items-center justify-center shadow-lg border border-accent/20">
            <Star className="w-16 h-16 text-accent fill-accent drop-shadow-md" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full animate-pulse shadow-md border-2 border-white" />
        </div>
        
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Starlinko</h1>
          <p className="text-muted-foreground text-sm mt-2">Dominez votre marché local</p>
        </div>
        
        {/* Loading indicator - couleurs du logo */}
        <div className="mt-8 flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};
