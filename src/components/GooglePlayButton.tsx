import { cn } from "@/lib/utils";
import { GOOGLE_PLAY_URL } from "@/hooks/useDeviceDetection";

interface GooglePlayButtonProps {
  variant?: "badge" | "button" | "link";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PlayStoreIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none">
    <path d="M48 59.49v393a11 11 0 0017.69 8.72l317.63-196.49a11 11 0 000-18.44L65.69 50.77A11 11 0 0048 59.49z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
    <path d="M359.36 311.63L101.6 448.5M101.6 63.5l257.76 136.87" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
  </svg>
);

export const GooglePlayButton = ({ 
  variant = "badge", 
  size = "md",
  className 
}: GooglePlayButtonProps) => {
  const sizeClasses = {
    sm: "h-10",
    md: "h-12",
    lg: "h-14",
  };

  if (variant === "link") {
    return (
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
      >
        <PlayStoreIcon className="w-4 h-4" />
        <span>Télécharger sur Google Play</span>
      </a>
    );
  }

  if (variant === "button") {
    return (
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-card rounded-xl font-semibold transition-all hover:bg-foreground/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
          sizeClasses[size],
          className
        )}
      >
        <PlayStoreIcon className="w-5 h-5" />
        <span>Installer l'app</span>
      </a>
    );
  }

  // Default: badge variant (Google Play official style)
  return (
    <a
      href={GOOGLE_PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 bg-foreground text-card px-4 rounded-lg transition-all hover:bg-foreground/90 shadow-md hover:shadow-lg",
        sizeClasses[size],
        className
      )}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z" fill="#4285F4"/>
        <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#34A853"/>
        <path d="M20.16 10.81C20.5 11.08 20.5 11.61 20.16 11.88L17.58 13.5L15.12 11.04L17.58 8.58L20.16 10.19C20.5 10.46 20.5 10.99 20.16 10.81Z" fill="#FBBC04"/>
        <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#EA4335"/>
      </svg>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[9px] uppercase tracking-wider opacity-80">Télécharger sur</span>
        <span className="text-sm font-semibold -mt-0.5">Google Play</span>
      </div>
    </a>
  );
};
