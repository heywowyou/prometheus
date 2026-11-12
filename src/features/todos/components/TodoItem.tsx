import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarClock,
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
  Type,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { ProgressRing } from "@components/ui/progress-ring";
import { formatClock } from "@lib/date/duration";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import { describeDue, type DueTone } from "../due";
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

const DUE_TONES: Record<DueTone, string> = {
  overdue: "text-destructive",
  today: "text-warning",
  soon: "text-rating",
  later: "text-muted-foreground",
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onTimer?: (id: string, action: TimerAction) => void;
  /** Enables inline renaming (menu → Rename, or F2 on the focused row). */
  onRename?: (id: string, text: string) => void;
  /** Omit (with onEdit) for a compact item, e.g. on the Today page. */
  onDelete?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
  onPause?: (id: string) => void;
  onHistory?: (todo: Todo) => void;
  /** A drag handle, rendered at the row's left edge when the list is sortable. */
  handle?: ReactNode;
}

function TodoItem({
  todo,
  onToggle,
  onTimer,
  onRename,
  onDelete,
  onEdit,
  onPause,
  onHistory,
  handle,
}: TodoItemProps) {
  const isRecurring = todo.recurrenceType !== "none";
  const isTimer = todo.interactionType === "timer" && Boolean(onTimer);
  const running = isTimer && Boolean(todo.timer?.startedAt) && !todo.completed;

  const now = useNow(running);
  const goalMs = Math.max(1, todo.durationGoal) * 60_000;
  const elapsed = isTimer ? timerElapsedMs(todo, now) : 0;
  const fraction = Math.min(1, elapsed / goalMs);
  const streak = todo.streak?.current ?? 0;
  const due = todo.dueDate && !isRecurring ? describeDue(todo.dueDate) : null;

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const renameFromMenuRef = useRef(false);

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
    if (renaming) return;
    if (isTimer && !todo.completed) startOrPause();
    else onToggle(todo._id);
  };

  const startRename = () => {
    if (!onRename) return;
    setDraft(todo.text);
    setRenaming(true);
  };

  const commitRename = () => {
    const text = draft.trim();
    setRenaming(false);
    if (text && text !== todo.text) onRename?.(todo._id, text);
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
      className={cn(
        "group relative flex cursor-pointer select-none items-center overflow-hidden rounded-xl border bg-card px-3 py-2.5 transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        due?.tone === "overdue" ? "border-destructive/40" : "border-border",
      )}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        } else if (event.key === "F2") {
          event.preventDefault();
          startRename();
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

      <div className="relative z-10 flex min-w-0 flex-1 items-center">
        {handle}
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
              "mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
              todo.completed
                ? "border-success bg-success"
                : "border-muted-foreground/50 group-hover:border-foreground",
            )}
          >
            {todo.completed && <Check className="h-3 w-3 text-background" strokeWidth={3} />}
          </div>
        )}

        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="flex min-w-0 flex-col text-sm">
            {renaming ? (
              <input
                autoFocus
                value={draft}
                maxLength={500}
                aria-label="Task name"
                onChange={(event) => setDraft(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter") commitRename();
                  if (event.key === "Escape") setRenaming(false);
                }}
                onBlur={commitRename}
                className="-mx-1 rounded-md border border-ring bg-background px-1 text-sm text-foreground outline-none"
              />
            ) : (
              <span
                className={cn(
                  "truncate",
                  todo.completed ? "text-muted-foreground line-through decoration-muted-foreground/60" : "text-foreground",
                )}
              >
                {todo.text}
              </span>
            )}
            {(detail || due) && (
              <span className="mt-0.5 flex items-center gap-2 text-xs">
                {due && !todo.completed && (
                  <span className={cn("flex items-center gap-1", DUE_TONES[due.tone])}>
                    <CalendarClock className="h-3 w-3" />
                    {due.label}
                  </span>
                )}
                {detail && (
                  <span className={cn("tabular-nums", running ? "text-rating" : "text-muted-foreground")}>
                    {detail}
                  </span>
                )}
              </span>
            )}
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {streak > 0 && (
              <span
                className="flex items-center text-xs font-medium tabular-nums text-streak"
                title={`Streak ${streak} · best ${todo.streak?.best ?? streak} · ${todo.completionCount} total`}
              >
                <Flame className="mr-0.5 h-3.5 w-3.5" strokeWidth={2.5} />
                {streak}
              </span>
            )}
            {isRecurring && streak === 0 && (
              <span
                className="flex items-center text-muted-foreground/60"
                title={RESET_LABELS[todo.recurrenceType] ?? undefined}
              >
                <Repeat2 className="h-3.5 w-3.5" strokeWidth={2} />
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
              className="ml-1 rounded-lg p-1.5 text-muted-foreground opacity-0 transition duration-200 hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 touch:opacity-100"
            >
              <Ellipsis className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
            // After "Rename", keep focus in the new input rather than handing
            // it back to the trigger (which would blur and end the rename).
            onCloseAutoFocus={(event) => {
              if (renameFromMenuRef.current) {
                renameFromMenuRef.current = false;
                event.preventDefault();
              }
            }}
          >
            {onRename && (
              <DropdownMenuItem
                onClick={() => {
                  renameFromMenuRef.current = true;
                  startRename();
                }}
              >
                <Type className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(todo)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
            )}
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
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(todo)}
                >
                  <Shredder className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default TodoItem;
