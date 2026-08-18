interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

const ReviewStar = ({ cx, fill }: { cx: number; fill: string }) => (
  <path
    d={`M ${cx} 25 l 2.2 4.5 5 .7 -3.6 3.5 .85 4.95 -4.45 -2.35 -4.45 2.35 .85 -4.95 -3.6 -3.5 5 -.7 Z`}
    fill={fill}
  />
);

const GoogleReviewMark = ({ className = "h-12 w-14" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 64 58"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Main G-shaped review bubble */}
    <path
      d="M46.8 8.2C41.9 4.2 35.7 2 29.3 2H20.2C10.2 2 2.2 10.1 2.2 20v13c0 6.1 3 11.6 7.7 14.8L7.9 55l9.3-4.2c1 .2 2 .3 3 .3h9.1c13.9 0 25.2-9 25.2-20.1v-5.3"
      stroke="#4285F4"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Red upper arc */}
    <path d="M29.3 2h8.4c3.6 0 6.7.8 9.1 2.2" stroke="#EA4335" strokeWidth="7" strokeLinecap="round" />
    {/* Yellow right arc */}
    <path d="M54.5 25.7V31c0 2.2-.4 4.3-1.2 6.2" stroke="#FBBC05" strokeWidth="7" strokeLinecap="round" />
    {/* Green lower-left bubble tail */}
    <path d="M9.9 47.8 7.9 55l9.3-4.2c1 .2 2 .3 3 .3h9.1" stroke="#34A853" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

    <ReviewStar cx={18} fill="#4285F4" />
    <ReviewStar cx={29} fill="#EA4335" />
    <ReviewStar cx={40} fill="#FBBC05" />
    <ReviewStar cx={51} fill="#34A853" />

    {/* Large AI sparkle */}
    <path d="M52.5 1.2c.55 4.4 2.85 6.7 7.25 7.25-4.4.55-6.7 2.85-7.25 7.25-.55-4.4-2.85-6.7-7.25-7.25 4.4-.55 6.7-2.85 7.25-7.25Z" fill="#1769FF" />
    <circle cx="47" cy="15.5" r="1.4" fill="#4285F4" />
    <circle cx="51" cy="18.8" r="1" fill="#4285F4" />
    <circle cx="55" cy="15.3" r=".9" fill="#4285F4" />
  </svg>
);

const AISparkle = () => (
  <svg viewBox="0 0 14 14" className="absolute -right-1.5 -top-3 h-4 w-4" aria-hidden="true">
    <path d="M7 .5c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6Z" fill="#1769FF" />
  </svg>
);

export const RankiLogo = ({ className = "", variant = "default" }: RankiLogoProps) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <GoogleReviewMark className="h-11 w-[50px] sm:h-12 sm:w-[55px] shrink-0" />
    <div
      className="flex items-baseline whitespace-nowrap text-[23px] sm:text-[26px] leading-none tracking-[-0.045em]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <span className="font-medium" aria-label="Google">
        {variant === "mono" ? (
          <span className="text-current">Google</span>
        ) : (
          <>
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </>
        )}
      </span>
      <span className="ml-2 font-semibold text-current">Review</span>
      <span className={`relative ml-0.5 font-semibold ${variant === "mono" ? "text-current" : "text-[#1769FF]"}`}>
        AI
        {variant !== "mono" && <AISparkle />}
      </span>
    </div>
  </div>
);

export { RankiLogo as StarlinkoLogo };
