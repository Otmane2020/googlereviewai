interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

const GoogleReviewMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 42 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 7.5C11.5 3.7 16.2 2 21.3 2c4.2 0 7.8 1.2 10.7 3.4" stroke="#4285F4" strokeWidth="5" strokeLinecap="round"/>
    <path d="M32 5.4c2.7 2.1 4.5 4.8 5.3 7.8" stroke="#EA4335" strokeWidth="5" strokeLinecap="round"/>
    <path d="M37.3 13.2c.8 3.4.2 6.9-1.6 9.8" stroke="#FBBC05" strokeWidth="5" strokeLinecap="round"/>
    <path d="M35.7 23c-3.2 5-8.4 7.5-14.7 7.5H13l-6.5 3 1.7-6.1C4.9 24.8 3 21 3 17c0-3.7 1.5-7 5-9.5" stroke="#34A853" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.2 16.5l1.4 2.8 3.1.45-2.25 2.2.53 3.1-2.78-1.46-2.78 1.46.53-3.1-2.25-2.2 3.1-.45 1.4-2.8Z" fill="#4285F4"/>
    <path d="M21 16.5l1.4 2.8 3.1.45-2.25 2.2.53 3.1L21 23.59l-2.78 1.46.53-3.1-2.25-2.2 3.1-.45 1.4-2.8Z" fill="#EA4335"/>
    <path d="M28.8 16.5l1.4 2.8 3.1.45-2.25 2.2.53 3.1-2.78-1.46-2.78 1.46.53-3.1-2.25-2.2 3.1-.45 1.4-2.8Z" fill="#FBBC05"/>
    <path d="M35.2 2.3l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9.9-2.2Z" fill="#4285F4"/>
  </svg>
);

export const RankiLogo = ({ className = "", variant = "default" }: RankiLogoProps) => (
  <div className={`group flex items-center gap-2.5 ${className}`}>
    <GoogleReviewMark className="h-8 w-9 sm:h-9 sm:w-10 shrink-0" />
    <div className="flex items-baseline font-semibold tracking-[-0.035em] text-lg sm:text-xl whitespace-nowrap">
      <span aria-label="Google" className={variant === "mono" ? "text-current" : ""}>
        {variant === "mono" ? "Google" : <><span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span></>}
      </span>
      <span className="text-current ml-1">Review</span>
      <span className={variant === "mono" ? "text-current" : "text-[#4285F4]"}>AI</span>
    </div>
  </div>
);

export { RankiLogo as StarlinkoLogo };
