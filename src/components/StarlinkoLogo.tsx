import logoMark from "@/assets/logo-mark.png";

interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
  compactOnMobile?: boolean;
}

const ReviewBubbleMark = ({ className = "h-10 w-11" }: { className?: string }) => (
  <img src={logoMark} alt="" aria-hidden="true" className={`${className} object-contain`} />
);

export const RankiLogo = ({ className = "", variant = "default", compactOnMobile = false }: RankiLogoProps) => (
  <div className={`group flex items-center gap-3 ${className}`}>
    <ReviewBubbleMark className="h-10 w-11 sm:h-11 sm:w-12 shrink-0" />
    {compactOnMobile && (
      <span className="sm:hidden text-[17px] font-semibold leading-none whitespace-nowrap tracking-tight">
        <span className="text-current">Reviews</span><span className="ml-1 text-[#3B54F5]">AI</span>
      </span>
    )}
    <div className={compactOnMobile ? "hidden sm:flex items-baseline whitespace-nowrap leading-none text-[22px] sm:text-[24px] font-medium tracking-[-0.045em]" : "flex items-baseline whitespace-nowrap leading-none text-[22px] sm:text-[24px] font-medium tracking-[-0.045em]"}>
      <span className="ml-1.5 text-current font-medium tracking-[-0.04em]">Reviews</span>
      <span className={`ml-1.5 font-semibold tracking-[-0.04em] ${variant === "mono" ? "text-current" : "text-[#3B54F5]"}`}>AI</span>
    </div>
  </div>
);

export { RankiLogo as StarlinkoLogo };