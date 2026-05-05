import { useEffect, useState } from "react";
import { StarlinkoLogo } from "./StarlinkoLogo";

interface AppLoadingBarProps {
  message?: string;
}

export const AppLoadingBar = ({ message = "Loading..." }: AppLoadingBarProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0 to 90% quickly, then slow down
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 300);
    const timer3 = setTimeout(() => setProgress(80), 600);
    const timer4 = setTimeout(() => setProgress(90), 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <StarlinkoLogo showBadge={false} />
          </div>
        </div>
        
        {/* Loading bar under header */}
        <div className="h-1 w-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
};
