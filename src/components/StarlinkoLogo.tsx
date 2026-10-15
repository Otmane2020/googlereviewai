import logoMark from "@/assets/logo-mark.png";
import { cn } from "@/lib/utils";

interface RankiLogoProps {
  className?: string;
  showBadge?: boolean;
  variant?: "default" | "mono";
  compactOnMobile?: boolean;
  markOnly?: boolean;
}

/**
 * Single logo across the app, login and onboarding: the actual multicolour
 * Reviews AI speech-bubble mark, paired with the blue AI wordmark.
 */
export const RankiLogo = ({
  className = "",
  variant = "default",
  compactOnMobile = false,
  markOnly = false,
}: RankiLogoProps) => (
  <span className={cn("inline-flex min-w-0 items-center gap-2.5 select-none", className)}>
    <img
      src={logoMark}
      alt=""
      aria-hidden="true"
      className="h-10 w-11 sm:h-11 sm:w-12 shrink-0 object-contain"
      draggable={false}
    />
    {!markOnly && (
      <span className={cn(
        "inline-flex whitespace-nowrap items-baseline leading-none font-bold tracking-[-0.045em]",
        compactOnMobile ? "text-[17px] sm:text-[23px]" : "text-[22px] sm:text-[24px]",
      )}>
        <span className="text-current">Reviews</span>
        <span className={cn("ml-1", variant === "mono" ? "text-current" : "text-[#3B54F5]")}>AI</span>
      </span>
    )}
  </span>
);

export { RankiLogo as StarlinkoLogo };
