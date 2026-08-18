interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

const GoogleReviewMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Multicolor review bubble */}
    <path d="M14 14C8.48 14 4 18.48 4 24v18c0 5.52 4.48 10 10 10h7l-7 8 16-8h20c5.52 0 10-4.48 10-10V24c0-5.52-4.48-10-10-10H14Z" fill="white"/>
    <path d="M14 14h12v7H14a3 3 0 0 0-3 3v7H4v-7c0-5.52 4.48-10 10-10Z" fill="#4285F4"/>
    <path d="M26 14h14v7H26v-7Z" fill="#EA4335"/>
    <path d="M40 14h10c5.52 0 10 4.48 10 10v8h-7v-8a3 3 0 0 0-3-3H40v-7Z" fill="#FBBC05"/>
    <path d="M60 32v10c0 5.52-4.48 10-10 10H30l-16 8 7-8h-7C8.48 52 4 47.52 4 42V31h7v11a3 3 0 0 0 3 3h38a3 3 0 0 0 3-3V32h5Z" fill="#34A853"/>

    {/* Review stars */}
    <path d="M18 28.5l1.4 2.84 3.13.45-2.26 2.2.53 3.11L18 35.63l-2.8 1.47.53-3.11-2.26-2.2 3.13-.45L18 28.5Z" fill="#4285F4"/>
    <path d="M28 28.5l1.4 2.84 3.13.45-2.26 2.2.53 3.11L28 35.63l-2.8 1.47.53-3.11-2.26-2.2 3.13-.45L28 28.5Z" fill="#EA4335"/>
    <path d="M38 28.5l1.4 2.84 3.13.45-2.26 2.2.53 3.11L38 35.63l-2.8 1.47.53-3.11-2.26-2.2 3.13-.45L38 28.5Z" fill="#FBBC05"/>
    <path d="M48 28.5l1.4 2.84 3.13.45-2.26 2.2.53 3.11L48 35.63l-2.8 1.47.53-3.11-2.26-2.2 3.13-.45L48 28.5Z" fill="#34A853"/>

    {/* AI sparkle */}
    <path d="M52 4c.8 5.6 3.4 8.2 9 9-5.6.8-8.2 3.4-9 9-.8-5.6-3.4-8.2-9-9 5.6-.8 8.2-3.4 9-9Z" fill="#2563EB"/>
  </svg>
);

const GoogleWord = () => (
  <span className="inline-flex font-semibold tracking-tight">
    <span style={{ color: "#4285F4" }}>G</span>
    <span style={{ color: "#EA4335" }}>o</span>
    <span style={{ color: "#FBBC05" }}>o</span>
    <span style={{ color: "#4285F4" }}>g</span>
    <span style={{ color: "#34A853" }}>l</span>
    <span style={{ color: "#EA4335" }}>e</span>
  </span>
);

export const RankiLogo = ({ className = "", variant = "default" }: RankiLogoProps) => {
  const mono = variant === "mono";

  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="GoogleReviewAI">
      <GoogleReviewMark className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
      <div className="flex items-baseline whitespace-nowrap text-lg sm:text-xl leading-none">
        {mono ? (
          <span className="font-semibold tracking-tight text-current">Google</span>
        ) : (
          <GoogleWord />
        )}
        <span className="font-semibold tracking-tight text-foreground">Review</span>
        <span className="font-semibold tracking-tight" style={{ color: "#2563EB" }}>AI</span>
      </div>
    </div>
  );
};

export { RankiLogo as StarlinkoLogo };
