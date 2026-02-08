import { useState, useEffect, useRef } from "react";
import { Clock, Flame } from "lucide-react";

interface CountdownBarProps {
  hoursFromNow?: number;
}

export const CountdownBar = ({ hoursFromNow = 4 }: CountdownBarProps) => {
  const getEndTime = () => {
    const stored = sessionStorage.getItem("countdown_end");
    if (stored) return parseInt(stored, 10);
    const end = Date.now() + hoursFromNow * 60 * 60 * 1000;
    sessionStorage.setItem("countdown_end", String(end));
    return end;
  };

  const endTimeRef = useRef<number>(getEndTime());

  const calcRemaining = () => Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const id = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const endDate = new Date(endTimeRef.current);
  const formattedDate = endDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = endDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-gradient-to-r from-destructive via-destructive/90 to-destructive text-destructive-foreground py-2.5 px-4 text-center text-sm font-medium animate-pulse-slow">
      <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
        <Flame className="w-4 h-4 shrink-0" />
        <span className="font-bold">OFFRE LIMITÉE</span>
        <span className="hidden sm:inline">— se termine le {formattedDate} à {formattedTime}</span>
        <span className="inline-flex items-center gap-1.5 bg-background/20 backdrop-blur-sm rounded-full px-3 py-0.5 font-mono font-bold text-sm tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </div>
    </div>
  );
};
