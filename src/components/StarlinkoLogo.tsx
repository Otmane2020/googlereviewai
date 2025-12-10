import { Star } from "lucide-react";

interface StarlinkoLogoProps {
  className?: string;
  showBadge?: boolean;
}

export const StarlinkoLogo = ({ className = "", showBadge = true }: StarlinkoLogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Star className="h-8 w-8 text-accent fill-accent" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse" />
      </div>
      <span className="text-xl font-bold tracking-tight">Starlinko</span>
      {showBadge && (
        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-secondary/20 text-secondary rounded-full border border-secondary/30">
          🔒 API vérifiée
        </span>
      )}
    </div>
  );
};
