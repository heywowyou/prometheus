import { Star } from "lucide-react";
import { cn } from "@lib/utils";

interface StarRatingProps {
  /** Filled stars, 0 to `max`. */
  value: number;
  max?: number;
  /** Omit to render a read-only rating. */
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  className?: string;
}

const SIZES = { sm: "w-3 h-3", md: "w-5 h-5" } as const;

/** 1–10 star rating, interactive when `onChange` is supplied. */
function StarRating({
  value,
  max = 10,
  onChange,
  size = "md",
  className,
}: StarRatingProps) {
  const interactive = onChange !== undefined;

  return (
    <div
      className={cn("flex items-center", size === "sm" ? "gap-0.5" : "gap-1", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Rating" : `Rated ${value} out of ${max}`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;
        const icon = (
          <Star
            className={cn(
              SIZES[size],
              "rounded-sm",
              filled ? "fill-rating text-rating" : "fill-border text-border",
            )}
          />
        );

        if (!interactive) return <span key={starValue}>{icon}</span>;

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} of ${max}`}
            onClick={() => onChange(starValue)}
            className="cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
export { StarRating };
