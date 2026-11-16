import { cn } from "@lib/utils";

/** Things' project pie: an outline that fills as tasks get done. */
export default function ProgressPie({
  done,
  total,
  className,
}: {
  done: number;
  total: number;
  className?: string;
}) {
  const ratio = total === 0 ? 0 : done / total;
  const radius = 4.5;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 14 14" className={cn("h-3.5 w-3.5 shrink-0 -rotate-90", className)} aria-hidden>
      <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle
        cx="7"
        cy="7"
        r={radius / 2}
        fill="none"
        stroke="currentColor"
        strokeWidth={radius}
        strokeDasharray={`${(ratio * circumference) / 2} ${circumference}`}
      />
    </svg>
  );
}
