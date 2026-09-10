"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type InteractiveStarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  ariaLabel?: string;
};

export default function InteractiveStarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  disabled = false,
  ariaLabel = "შეფასება",
}: InteractiveStarRatingProps) {
  const iconSize =
    size === "lg" ? "size-7" : size === "md" ? "size-6" : "size-5";

  return (
    <div className="flex gap-1" role="radiogroup" aria-label={ariaLabel}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className="rounded p-0.5 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            role="radio"
            aria-checked={filled}
            aria-label={`${starValue} ვარსკვლავი`}
          >
            <Star
              className={cn(
                iconSize,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-neutral-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
