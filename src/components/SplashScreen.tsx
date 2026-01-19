import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gradient-hero transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl bg-card/10 backdrop-blur-sm border border-card/20 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-card" />
        </div>
        
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-card tracking-tight">Starlinko</h1>
          <p className="text-card/70 text-sm mt-2">Dominez votre marché local</p>
        </div>
        
        {/* Loading indicator */}
        <div className="mt-8 flex gap-1">
          <div className="w-2 h-2 rounded-full bg-card/50 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-card/50 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-card/50 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};
