interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

/**
 * Ranki.ai logo — geo pin + ranking bars motif inside.
 * Filename kept as Ranki.aiLogo.tsx to avoid breaking imports across the app.
 * Exported as both Ranki.aiLogo (compat) and RankiLogo.
 */
const RankiMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ranki-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--secondary))" />
      </linearGradient>
    </defs>
    {/* Geo pin shape */}
    <path
      d="M16 2C9.925 2 5 6.925 5 13c0 7.5 11 17 11 17s11-9.5 11-17c0-6.075-4.925-11-11-11z"
      fill="url(#ranki-grad)"
    />
    {/* Ranking bars inside the pin */}
    <rect x="10.5" y="11" width="2.5" height="6" rx="0.6" fill="white" opacity="0.95" />
    <rect x="14.75" y="8.5" width="2.5" height="8.5" rx="0.6" fill="white" />
    <rect x="19" y="13" width="2.5" height="4" rx="0.6" fill="white" opacity="0.85" />
    {/* Sparkle / AI dot */}
    <circle cx="23.5" cy="7.5" r="2.2" fill="hsl(var(--accent))" />
    <circle cx="23.5" cy="7.5" r="0.9" fill="white" />
  </svg>
);

export const RankiLogo = ({ className = "", showBadge = true, variant = "default" }: RankiLogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <RankiMark className="h-7 w-7 sm:h-8 sm:w-8" />
      <div className="flex items-baseline">
        <span className="text-lg sm:text-xl font-bold tracking-tight">Ranki</span>
        <span className="text-lg sm:text-xl font-bold tracking-tight text-primary">.ai</span>
      </div>
    </div>
  );
};

// Backwards-compatible export — many files still import Ranki.aiLogo by name.
export const Ranki.aiLogo = RankiLogo;
