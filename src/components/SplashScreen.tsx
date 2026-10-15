import { useEffect, useState } from "react";

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
        {/* Reviews AI icon — no sparkles or third-party logos */}
        <img src="/logo-mark.png" alt="" aria-hidden="true" className="h-24 w-24 object-contain drop-shadow-lg" />
        <h1 className="text-3xl font-bold tracking-tight text-white">Reviews <span className="text-blue-200">AI</span></h1>

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