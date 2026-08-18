interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

const Star = ({ x, fill }: { x: number; fill: string }) => (
  <path transform={`translate(${x} 18)`} d="M0-3.5 1.03-1.1 3.6-.9 1.65.8 2.25 3.35 0 2-2.25 3.35-1.65.8-3.6-.9-1.03-1.1Z" fill={fill} />
);

const GoogleReviewMark = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Rounded review bubble ring, matching the supplied reference */}
    <path d="M36.7 7.1A18.1 18.1 0 0 0 24.2 2.5H15.8A13.3 13.3 0 0 0 2.5 15.8v8.3c0 4.3 2.05 8.1 5.22 10.54L6.1 40l7.2-3.1c.82.16 1.66.24 2.5.24h8.4c10.5 0 18.95-7.62 18.95-17.02v-2.7" stroke="#4285F4" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.7 25.3c.55 3.85 2.35 7.05 5.02 9.34L6.1 40l7.2-3.1" stroke="#34A853" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.3 36.9h10.9c8.6 0 15.8-5.1 18.2-12.2" stroke="#34A853" strokeWidth="5.4" strokeLinecap="round"/>
    <path d="M42.4 24.7c.52-1.47.75-3.03.75-4.58v-2.7" stroke="#FBBC05" strokeWidth="5.4" strokeLinecap="round"/>
    <path d="M24.2 2.5h8.25c1.55 0 3 .23 4.25.68" stroke="#EA4335" strokeWidth="5.4" strokeLinecap="round"/>
    <Star x={13.2} fill="#4285F4"/><Star x={21.2} fill="#EA4335"/><Star x={29.2} fill="#FBBC05"/><Star x={37.2} fill="#34A853"/>
    {/* AI sparkle */}
    <path d="M41 1.2c.45 3.5 2.25 5.3 5.8 5.8-3.55.45-5.35 2.25-5.8 5.8-.45-3.55-2.25-5.35-5.8-5.8 3.55-.5 5.35-2.3 5.8-5.8Z" fill="#1769FF"/>
    <circle cx="37.2" cy="12.4" r="1.15" fill="#4285F4"/><circle cx="40.5" cy="14.7" r=".8" fill="#4285F4"/>
  </svg>
);

const AISparkle = () => <svg viewBox="0 0 12 12" className="absolute -right-1 -top-2 h-3 w-3" aria-hidden="true"><path d="M6 .3c.42 3.05 2.05 4.68 5.1 5.1C8.05 5.82 6.42 7.45 6 10.5 5.58 7.45 3.95 5.82.9 5.4 3.95 4.98 5.58 3.35 6 .3Z" fill="#1769FF"/></svg>;

export const RankiLogo = ({ className = "", variant = "default" }: RankiLogoProps) => (
  <div className={`group flex items-center gap-2.5 ${className}`}>
    <GoogleReviewMark className="h-9 w-10 sm:h-10 sm:w-11 shrink-0" />
    <div className="flex items-baseline font-medium tracking-[-0.045em] text-xl sm:text-[22px] whitespace-nowrap leading-none">
      <span aria-label="Google" className={variant === "mono" ? "text-current" : ""}>
        {variant === "mono" ? "Google" : <><span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span></>}
      </span>
      <span className="text-current ml-1.5">Review</span>
      <span className={`relative ml-0.5 font-semibold ${variant === "mono" ? "text-current" : "text-[#1769FF]"}`}>AI{variant !== "mono" && <AISparkle />}</span>
    </div>
  </div>
);

export { RankiLogo as StarlinkoLogo };
