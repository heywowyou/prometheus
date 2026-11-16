import { Link } from "react-router-dom";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import { PHASE_LABELS, formatRemaining, isRunning, isStarted, remainingAt, useFocusState } from "../focus-store";

/** The running (or paused) focus timer in the top bar, visible from every page. */
export default function FocusPill() {
  const state = useFocusState();
  const running = isRunning(state);
  const now = useNow(running, 1_000);
  if (!isStarted(state)) return null;
  const label = `${PHASE_LABELS[state.phase]}: ${formatRemaining(remainingAt(state, now))}${running ? "" : ", paused"}`;
  return (
    <Link
      to="/today#focus"
      aria-label={label}
      title={label}
      className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm tabular-nums text-foreground transition-colors hover:border-muted-foreground/60"
    >
      <span
        aria-hidden
        className={cn(
          "h-2 w-2 rounded-full",
          state.phase === "focus" ? "bg-rating" : "bg-info",
          running ? "animate-pulse" : "opacity-50",
        )}
      />
      {formatRemaining(remainingAt(state, now))}
    </Link>
  );
}
