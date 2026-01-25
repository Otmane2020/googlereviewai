import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Transition rapide - juste assez pour le fade-in
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 300);
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, hsl(217 91% 45%) 0%, hsl(222 47% 25%) 100%)"
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo étoile jaune avec ombre et point vert */}
        <div className="relative">
          <Star 
            className="w-16 h-16 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" 
            fill="#F5B800" 
            stroke="#F5B800" 
            strokeWidth={0}
          />
          {/* Point vert/cyan */}
          <div className="absolute -right-1 bottom-1 w-3 h-3 rounded-full bg-[#2DD4BF] shadow-md" />
        </div>
        
        {/* Brand avec Google G */}
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Starlinko</h1>
          {/* Google G icon */}
          <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
        
        {/* Loading indicator */}
        <div className="mt-10 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};
