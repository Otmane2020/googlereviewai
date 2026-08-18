interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

const ReviewBubbleMark = ({ className = "h-10 w-11" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 58" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <filter id="gr-ai-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.8" floodOpacity="0.12"/>
      </filter>
    </defs>
    <g filter="url(#gr-ai-shadow)">
      <path d="M48.2 10.2A23.8 23.8 0 0 0 31.8 4H21.4C11.8 4 4 11.8 4 21.4v10.2c0 6.1 3.1 11.8 8.2 15.1L10.4 54l9.3-4c.6.1 1.2.1 1.7.1h10.4C45.2 50.1 56 39.8 56 27.1v-4.4" stroke="#4285F4" strokeWidth="7.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.6 32.3c.7 5.7 3.4 10.6 7.6 14.4L10.4 54l9.3-4" stroke="#34A853" strokeWidth="7.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.7 50h12.1c10.6 0 19.6-6.8 22.8-16.3" stroke="#34A853" strokeWidth="7.2" strokeLinecap="round"/>
      <path d="M54.6 33.7c.9-2.4 1.4-4.9 1.4-7.7v-3.3" stroke="#FBBC05" strokeWidth="7.2" strokeLinecap="round"/>
      <path d="M31.8 4h10.1c2.2 0 4.4.3 6.3 1" stroke="#EA4335" strokeWidth="7.2" strokeLinecap="round"/>
    </g>

    <path d="M13 26.4l1.85 3.75 4.14.6-3 2.92.71 4.12L13 35.84l-3.7 1.95.71-4.12-3-2.92 4.14-.6L13 26.4Z" fill="#4285F4"/>
    <path d="M25.3 26.4l1.85 3.75 4.14.6-3 2.92.71 4.12-3.7-1.95-3.7 1.95.71-4.12-3-2.92 4.14-.6 1.85-3.75Z" fill="#EA4335"/>
    <path d="M37.6 26.4l1.85 3.75 4.14.6-3 2.92.71 4.12-3.7-1.95-3.7 1.95.71-4.12-3-2.92 4.14-.6 1.85-3.75Z" fill="#FBBC05"/>
    <path d="M49.9 26.4l1.85 3.75 4.14.6-3 2.92.71 4.12-3.7-1.95-3.7 1.95.71-4.12-3-2.92 4.14-.6 1.85-3.75Z" fill="#34A853"/>

    <path d="M54.2 2.4c.7 5.1 3.4 7.8 8.5 8.5-5.1.7-7.8 3.4-8.5 8.5-.7-5.1-3.4-7.8-8.5-8.5 5.1-.7 7.8-3.4 8.5-8.5Z" fill="#1769FF"/>
    <circle cx="48.6" cy="16.7" r="1.4" fill="#4285F4"/>
    <circle cx="52.6" cy="19.3" r="1" fill="#4285F4"/>
    <circle cx="45.6" cy="20" r=".9" fill="#4285F4"/>
  </svg>
);

const AISparkle = () => (
  <svg viewBox="0 0 14 14" className="absolute -right-1.5 -top-2.5 h-3.5 w-3.5" aria-hidden="true">
    <path d="M7 .4c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6Z" fill="#1769FF"/>
  </svg>
);

export const RankiLogo = ({ className = "", variant = "default" }: RankiLogoProps) => (
  <div className={`group flex items-center gap-3 ${className}`}>
    <ReviewBubbleMark className="h-10 w-11 sm:h-11 sm:w-12 shrink-0" />
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
