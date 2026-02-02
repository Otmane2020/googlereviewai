import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import { useDeviceDetection, GOOGLE_PLAY_URL } from "@/hooks/useDeviceDetection";

export const MobileStickyButton = () => {
  const navigate = useNavigate();
  const { isAndroid } = useDeviceDetection();

  // On Android, show Google Play button
  if (isAndroid) {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent sm:hidden z-40">
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full h-12 bg-foreground text-card rounded-lg font-semibold shadow-xl hover:bg-foreground/90 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z" fill="#4285F4"/>
            <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#34A853"/>
            <path d="M20.16 10.81C20.5 11.08 20.5 11.61 20.16 11.88L17.58 13.5L15.12 11.04L17.58 8.58L20.16 10.19C20.5 10.46 20.5 10.99 20.16 10.81Z" fill="#FBBC04"/>
            <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#EA4335"/>
          </svg>
          Installer l'app
        </a>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent sm:hidden z-40">
      <Button 
        variant="default" 
        size="lg" 
        className="w-full gap-2 h-12 text-base font-semibold shadow-xl"
        onClick={() => navigate("/auth")}
      >
        <Zap className="w-5 h-5" />
        Essai gratuit 3 jours
      </Button>
    </div>
  );
};
