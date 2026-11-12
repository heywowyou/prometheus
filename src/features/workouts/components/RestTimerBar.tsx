import { SkipForward } from "lucide-react";
import { ProgressRing } from "@components/ui/progress-ring";
import { formatClock } from "@lib/date/duration";
import { cn } from "@lib/utils";

interface RestTimerBarProps {
  remainingMs: number;
  fraction: number;
  finished: boolean;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
}

/** The rest countdown, shown in the session's bottom bar between sets. */
function RestTimerBar({ remainingMs, fraction, finished, onAdjust, onSkip }: RestTimerBarProps) {
  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2 transition-colors",
        finished ? "border-success bg-success/15" : "border-border bg-secondary",
      )}
    >
      <div className="relative h-11 w-11 shrink-0">
        <ProgressRing fraction={fraction} strokeWidth={3} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{finished ? "Rest over" : "Rest"}</p>
        <p className="text-2xl font-semibold tabular-nums leading-tight text-foreground">
          {finished ? "Go!" : formatClock(remainingMs + 999)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onAdjust(-15)}
        className="h-11 rounded-lg px-3 text-sm font-medium tabular-nums text-muted-foreground hover:bg-card hover:text-foreground"
      >
        −15
      </button>
      <button
        type="button"
        onClick={() => onAdjust(15)}
        className="h-11 rounded-lg px-3 text-sm font-medium tabular-nums text-muted-foreground hover:bg-card hover:text-foreground"
      >
        +15
      </button>
      <button
        type="button"
        aria-label="Skip rest"
        onClick={onSkip}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <SkipForward className="h-5 w-5" />
      </button>
    </div>
  );
}

export default RestTimerBar;
