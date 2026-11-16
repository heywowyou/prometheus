import { Minus, Pause, Play, Plus, RotateCcw, Settings2, SkipForward } from "lucide-react";
import { Button } from "@components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import {
  PHASE_LABELS,
  focusActions,
  formatRemaining,
  isRunning,
  isStarted,
  phaseMs,
  remainingAt,
  useFocusState,
  type FocusPhase,
  type FocusSettings,
} from "../focus-store";
import { primeAudio } from "../chime";

const PHASES: FocusPhase[] = ["focus", "short", "long"];

const LIMITS: Record<keyof FocusSettings, { min: number; max: number; step: number; unit: string; label: string }> = {
  focus: { min: 5, max: 120, step: 5, unit: "min", label: "Focus" },
  short: { min: 1, max: 30, step: 1, unit: "min", label: "Short break" },
  long: { min: 5, max: 60, step: 5, unit: "min", label: "Long break" },
  rounds: { min: 2, max: 8, step: 1, unit: "blocks", label: "Long break after" },
};

function Stepper({ name, value }: { name: keyof FocusSettings; value: number }) {
  const limit = LIMITS[name];
  const change = (delta: number) =>
    focusActions.updateSettings({ [name]: Math.min(limit.max, Math.max(limit.min, value + delta)) });
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-soft">{limit.label}</span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Less ${limit.label.toLowerCase()}`}
          onClick={() => change(-limit.step)}
          disabled={value <= limit.min}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-16 text-center text-sm tabular-nums text-foreground">
          {value} {limit.unit}
        </span>
        <button
          type="button"
          aria-label={`More ${limit.label.toLowerCase()}`}
          onClick={() => change(limit.step)}
          disabled={value >= limit.max}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  );
}

/**
 * A plain Pomodoro timer: focus, short break, and a long break after a few
 * blocks. Phases don't start on their own; the next one waits for Start.
 */
export default function FocusTimer({ className }: { className?: string }) {
  const state = useFocusState();
  const running = isRunning(state);
  const now = useNow(running, 500);
  const remaining = remainingAt(state, now);
  const total = phaseMs(state.phase, state.settings);
  const progress = total > 0 ? 1 - remaining / total : 0;

  return (
    <section className={cn("panel p-5 sm:p-6", className)} aria-label="Focus timer">
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" aria-label="Phase" className="flex gap-1">
          {PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              role="tab"
              aria-selected={state.phase === phase}
              onClick={() => focusActions.choose(phase)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors",
                state.phase === phase ? "bg-raised text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {phase === "focus" ? "Focus" : phase === "short" ? "Break" : "Long break"}
            </button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Timer settings"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <p className="eyebrow mb-2">Lengths</p>
            {(Object.keys(LIMITS) as Array<keyof FocusSettings>).map((name) => (
              <Stepper key={name} name={name} value={state.settings[name]} />
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p
            className="font-serif text-6xl leading-none tabular-nums text-foreground sm:text-7xl"
            aria-live="off"
            aria-label={`${PHASE_LABELS[state.phase]}, ${formatRemaining(remaining)} left`}
          >
            {formatRemaining(remaining)}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-1" aria-label={`Block ${Math.min(state.round + 1, state.settings.rounds)} of ${state.settings.rounds}`}>
              {Array.from({ length: state.settings.rounds }, (_, index) => (
                <span
                  key={index}
                  className={cn("h-1.5 w-1.5 rounded-full", index < state.round ? "bg-rating" : "bg-secondary")}
                />
              ))}
            </span>
            {state.doneToday > 0
              ? `${state.doneToday} focus block${state.doneToday === 1 ? "" : "s"} today`
              : PHASE_LABELS[state.phase]}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Reset"
            title="Reset"
            onClick={focusActions.reset}
            disabled={!isStarted(state)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Skip to next phase"
            title="Skip to next phase"
            onClick={focusActions.skip}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <Button
            onClick={() => {
              if (running) focusActions.pause();
              else {
                primeAudio();
                focusActions.start();
              }
            }}
            className="min-w-[6.5rem]"
          >
            {running ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            {running ? "Pause" : isStarted(state) ? "Resume" : "Start"}
          </Button>
        </div>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-linear", state.phase === "focus" ? "bg-rating" : "bg-info")}
          style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
        />
      </div>
    </section>
  );
}
