import { useEffect, useRef } from "react";
import {
  CalendarDays,
  Check,
  Ellipsis,
  Flame,
  PauseCircle,
  Pause,
  Pencil,
  Play,
  Repeat2,
  RotateCcw,
  Shredder,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import {
  timerElapsedMs,
  type RecurrenceType,
  type TimerAction,
  type Todo,
} from "../types/todo-types";

const RESET_LABELS: Record<RecurrenceType, string | null> = {
  none: null,
  daily: "Resets daily",
  weekly: "Resets every Monday",
  monthly: "Resets on the 1st",
};

/** 754_000 → "12:34"; 3_725_000 → "1:02:05". */
const formatClock = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onTimer?: (id: string, action: TimerAction) => void;
  onDelete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onPause?: (id: string) => void;
  onHistory?: (todo: Todo) => void;
}

/** SVG ring showing timer progress around the play/pause icon. */
function ProgressRing({ fraction }: { fraction: number }) {
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90" aria-hidden>
      <circle cx="16" cy="16" r={radius} className="fill-none stroke-border" strokeWidth="2.5" />
      <circle
        cx="16"
        cy="16"
        r={radius}
        className="fill-none stroke-rating transition-[stroke-dashoffset] duration-1000 ease-linear"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
      />
    </svg>
  );
}

function TodoItem({
  todo,
  onToggle,
  onTimer,
  onDelete,
  onEdit,
  onPause,
  onHistory,
}: TodoItemProps) {
  const isRecurring = todo.recurrenceType !== "none";
  const isTimer = todo.interactionType === "timer" && Boolean(onTimer);
  const running = isTimer && Boolean(todo.timer?.startedAt) && !todo.completed;

  const now = useNow(running);
  const goalMs = Math.max(1, todo.durationGoal) * 60_000;
  const elapsed = isTimer ? timerElapsedMs(todo, now) : 0;
  const fraction = Math.min(1, elapsed / goalMs);
  const streak = todo.streak?.current ?? 0;

  // Complete the task once the running timer reaches its goal — once per run,
  // also when the page opens on a timer that finished while it was closed.
  const completedRunRef = useRef<string | null>(null);
  useEffect(() => {
    const run = todo.timer?.startedAt ?? null;
    if (!running || !run || elapsed < goalMs || completedRunRef.current === run) return;
    completedRunRef.current = run;
    onToggle(todo._id);
    toast.success(`${todo.text} — time's up`);
  }, [running, elapsed, goalMs, onToggle, todo._id, todo.text, todo.timer?.startedAt]);

  const startOrPause = () => {
    if (!onTimer) return;
    onTimer(todo._id, running ? "pause" : "start");
  };

  /** Row activation: timers start/pause; everything else (and done timers) toggles. */
  const activate = () => {
    if (isTimer && !todo.completed) startOrPause();
    else onToggle(todo._id);
  };

  const detail = (() => {
    if (isTimer && !todo.completed && elapsed > 0) {
      return `${formatClock(elapsed)} / ${formatClock(goalMs)}`;
    }
    return todo.durationGoal > 0 ? `${todo.durationGoal} min` : null;
  })();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={todo.completed}
      className="group relative flex cursor-pointer select-none items-center overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      onClick={activate}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      }}
    >
      {isTimer && !todo.completed && fraction > 0 && (
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 z-0 bg-secondary transition-[width] duration-1000 ease-linear"
          style={{ width: `${fraction * 100}%` }}
        />
      )}

      <div className="relative z-10 flex flex-1 items-center">
        {isTimer && !todo.completed ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              startOrPause();
            }}
            aria-label={running ? `Pause timer for ${todo.text}` : `Start timer for ${todo.text}`}
            className="relative mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <ProgressRing fraction={fraction} />
            {running ? (
              <Pause className="relative h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="relative ml-0.5 h-3.5 w-3.5 fill-current" />
            )}
          </button>
        ) : (
          <div
            aria-hidden
            className={cn(
              "mr-3 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ease-in-out",
              todo.completed
                ? "border-primary bg-primary"
                : "border-border group-hover:border-muted-foreground",
            )}
          >
            {todo.completed && (
              <div className="h-2 w-2 rounded-[1px] bg-primary-foreground" />
            )}
          </div>
        )}

        <span
          className={cn(
            "flex flex-1 items-center justify-between gap-3 transition-colors",
            todo.completed ? "text-muted-foreground" : "text-foreground",
          )}
        >
          <span className="flex min-w-0 flex-col text-sm">
            <span className={cn(todo.completed && "line-through opacity-60")}>
              {todo.text}
            </span>
            {detail && (
              <span
                className={cn(
                  "mt-0.5 text-xs tabular-nums",
                  running ? "text-rating" : "text-muted-foreground",
                )}
              >
                {detail}
              </span>
            )}
          </span>

          <span className="flex items-center gap-2">
            {isRecurring && (
              <span
                className="flex items-center text-muted-foreground"
                title={RESET_LABELS[todo.recurrenceType] ?? undefined}
              >
                <Repeat2 className="h-4 w-4" strokeWidth={2} />
              </span>
            )}
            {streak > 0 && (
              <span
                className="flex items-center text-xs font-normal text-orange-400"
                title={`Streak ${streak} · best ${todo.streak?.best ?? streak} · ${todo.completionCount} total`}
              >
                <Flame className="mr-1 h-3.5 w-3.5" strokeWidth={2.5} />
                {streak}
              </span>
            )}
          </span>
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${todo.text}`}
              onClick={(event) => event.stopPropagation()}
              className="rounded-xl p-1.5 text-muted-foreground opacity-0 transition duration-200 ease-in-out hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 touch:opacity-100"
            >
              <Ellipsis className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => onEdit(todo)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            {isTimer && !todo.completed && (
              <DropdownMenuItem onClick={() => onToggle(todo._id)}>
                <Check className="mr-2 h-3.5 w-3.5" />
                Mark done
              </DropdownMenuItem>
            )}
            {isTimer && !todo.completed && elapsed > 0 && onTimer && (
              <DropdownMenuItem onClick={() => onTimer(todo._id, "reset")}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Reset timer
              </DropdownMenuItem>
            )}
            {isRecurring && onHistory && (
              <DropdownMenuItem onClick={() => onHistory(todo)}>
                <CalendarDays className="mr-2 h-3.5 w-3.5" />
                History
              </DropdownMenuItem>
            )}
            {isRecurring && onPause && (
              <DropdownMenuItem onClick={() => onPause(todo._id)}>
                <PauseCircle className="mr-2 h-3.5 w-3.5" />
                Pause
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(todo)}
            >
              <Shredder className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default TodoItem;
