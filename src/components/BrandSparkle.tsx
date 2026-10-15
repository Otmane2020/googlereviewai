import { cn } from "@/lib/utils";

interface BrandSparkleProps extends React.HTMLAttributes<HTMLImageElement> {
  className?: string;
}

/**
 * Brand icon used in compact AI indicators; no sparkle glyphs.
 */
export const BrandSparkle = ({ className, ...props }: BrandSparkleProps) => (
  <img
    src="/logo-mark.png"
    alt=""
    aria-hidden="true"
    draggable={false}
    {...props}
    className={cn("inline-block h-4 w-4 object-contain select-none", className)}
  />
);

export default BrandSparkle;
