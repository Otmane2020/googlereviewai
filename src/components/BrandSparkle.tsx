import { cn } from "@/lib/utils";

interface BrandSparkleProps extends React.HTMLAttributes<HTMLImageElement> {
  className?: string;
}

/**
 * Drop-in replacement for the Lucide `Sparkles` icon, using the GoogleReviewAI/Starlinko
 * favicon logo so the brand identity stays consistent everywhere.
 */
export const BrandSparkle = ({ className, ...props }: BrandSparkleProps) => (
  <img
    src="/favicon.svg"
    alt=""
    aria-hidden="true"
    draggable={false}
    {...props}
    className={cn("inline-block h-4 w-4 object-contain select-none", className)}
  />
);

export default BrandSparkle;
