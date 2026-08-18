import logoMark from "@/assets/logo-mark.png";

interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
}

const ReviewBubbleMark = ({ className = "h-10 w-11" }: { className?: string }) => (
  <img src={logoMark} alt="" aria-hidden="true" className={`${className} object-contain`} />
);

const AISparkle = () => (
  <svg viewBox="0 0 14 14" className="absolute -right-1.5 -top-2.5 h-3.5 w-3.5" aria-hidden="true">
    <path d="M7 .4c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6Z" fill="#1769FF"/>
  </svg>
);

const GoogleWord = ({ mono }: { mono: boolean }) => mono ? (
  <span className="text-current">Google</span>
) : (
  <span aria-label="Google">
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

export const RankiLogo = ({ className = "", variant = "default" }: RankiLogoProps) => (
  <div className={`group flex items-center gap-3 ${className}`}>
    <ReviewBubbleMark className="h-10 w-11 sm:h-11 sm:w-12 shrink-0" />
    <div className="flex items-baseline whitespace-nowrap leading-none text-[22px] sm:text-[24px] font-medium tracking-[-0.045em]">
      <GoogleWord mono={variant === "mono"} />
      <span className="ml-1.5 text-current font-medium tracking-[-0.04em]">Review</span>
      <span className={`relative ml-0.5 font-semibold tracking-[-0.04em] ${variant === "mono" ? "text-current" : "text-[#1769FF]"}`}>AI{variant !== "mono" && <AISparkle />}</span>
    </div>
  </div>
);

export { RankiLogo as StarlinkoLogo };
