interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

const GoogleRingMark = ({ className = "h-10 w-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <filter id="gr-ai-ring-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.4" stdDeviation="1.6" floodOpacity="0.12"/>
      </filter>
    </defs>
    <g filter="url(#gr-ai-ring-shadow)">
      <path d="M17.56 12.83A24 24 0 0 1 46.44 12.83" stroke="#EA4335" strokeWidth="8" strokeLinecap="round"/>
      <path d="M51.17 17.56A24 24 0 0 1 51.17 46.44" stroke="#4285F4" strokeWidth="8" strokeLinecap="round"/>
      <path d="M46.44 51.17A24 24 0 0 1 17.56 51.17" stroke="#34A853" strokeWidth="8" strokeLinecap="round"/>
      <path d="M12.83 46.44A24 24 0 0 1 12.83 17.56" stroke="#FBBC05" strokeWidth="8" strokeLinecap="round"/>
    </g>
    <path d="M32 20l3.06 7.79 8.35.5-6.4 5.32 2.1 8.1L32 37.2l-7.11 4.51 2.16-8.1-6.46-5.32 8.35-.5L32 20Z" fill="#4285F4"/>
    <path d="M54 3c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6Z" fill="#1769FF"/>
  </svg>
);

const AISparkle = () => (
  <svg viewBox="0 0 14 14" className="absolute -right-1.5 -top-2.5 h-3.5 w-3.5" aria-hidden="true">
    <path d="M7 .4c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6Z" fill="#1769FF"/>
  </svg>
);

export const RankiLogo = ({ className = "", variant = "default" }: RankiLogoProps) => (
  <div className={`group flex items-center gap-3 ${className}`}>
    <GoogleRingMark className="h-10 w-10 sm:h-11 sm:w-11 shrink-0" />
    <div className="flex items-baseline whitespace-nowrap leading-none text-[22px] sm:text-[24px] font-medium tracking-[-0.045em]">
      <span aria-label="Google" className={variant === "mono" ? "text-current" : "text-[#4285F4]"}>
        Google
      </span>
      <span className="ml-1.5 text-current font-medium tracking-[-0.04em]">Review</span>
      <span className={`relative ml-0.5 font-semibold tracking-[-0.04em] ${variant === "mono" ? "text-current" : "text-[#1769FF]"}`}>AI{variant !== "mono" && <AISparkle />}</span>
    </div>
  </div>
);

export { RankiLogo as StarlinkoLogo };
