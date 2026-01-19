import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";

export const MobileStickyButton = () => {
  const navigate = useNavigate();

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
