import { cn } from "@lib/utils";

interface ProgressRingProps {
  /** 0–1. */
  fraction: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * SVG ring filling clockwise from 12 o'clock. Positioned absolutely, so it
 * wraps whatever its `relative` parent contains (an icon, a countdown…).
 */
export function ProgressRing({ fraction, className, strokeWidth = 2.5 }: ProgressRingProps) {
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, fraction));
  return (
    <svg viewBox="0 0 32 32" className={cn("absolute inset-0 -rotate-90", className)} aria-hidden>
      <circle
        cx="16"
        cy="16"
        r={radius}
        className="fill-none stroke-border"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="16"
        cy="16"
        r={radius}
        className="fill-none stroke-rating transition-[stroke-dashoffset] duration-1000 ease-linear"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
      />
    </svg>
  );
}
