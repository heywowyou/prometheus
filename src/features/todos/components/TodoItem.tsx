import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarClock, Check, Ellipsis, Pause, Play, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { ProgressRing } from "@components/ui/progress-ring";
import { AppIcon } from "@components/ui/icon-picker";
import { ActionSheet } from "@components/ui/action-sheet";
import { useLongPress } from "@lib/hooks/useLongPress";
import { formatClock } from "@lib/date/duration";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import { describeDue, type DueTone } from "../due";
import { habitActions, habitSummary } from "../habit-actions";
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
  today: "text-info",
  soon: "text-soft",
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
  /** Habits: turn into a repeating task (history kept). */
  onConvert?: (todo: Todo) => void;
  /** Habits: skip this cycle (a rest day) or take the skip back. */
  onSkip?: (id: string) => void;
  /** Extra content at the row's end (the Habits page's week dots). */
  renderTrailing?: (todo: Todo) => ReactNode;
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
  onConvert,
  onSkip,
  renderTrailing,
  handle,
}: TodoItemProps) {
  const skipped = Boolean(todo.skipped) && !todo.completed;
  const isRecurring = todo.recurrenceType !== "none";
  const isTimer = todo.interactionType === "timer" && Boolean(onTimer);
  const running = isTimer && Boolean(todo.timer?.startedAt) && !todo.completed;

  const now = useNow(running);
  const goalMs = Math.max(1, todo.durationGoal) * 60_000;
  const elapsed = isTimer ? timerElapsedMs(todo, now) : 0;
  const fraction = Math.min(1, elapsed / goalMs);
  const due = todo.dueDate && !isRecurring ? describeDue(todo.dueDate) : null;

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [sheetOpen, setSheetOpen] = useState(false);
  const longPress = useLongPress(() => setSheetOpen(true), { disabled: renaming });

  // Complete the task once the running timer reaches its goal — once per run,
  // also when the page opens on a timer that finished while it was closed.
  const completedRunRef = useRef<string | null>(null);
  useEffect(() => {
    const run = todo.timer?.startedAt ?? null;
    if (!running || !run || elapsed < goalMs || completedRunRef.current === run) return;
    completedRunRef.current = run;
    onToggle(todo._id);
    toast.success(`${todo.text}: time's up`);
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

  const handlers = { onToggle, onTimer, onEdit, onSkip, onHistory, onPause, onConvert, onDelete };
  const actionHandlers = { ...handlers, onRename: onRename ? startRename : undefined };
  const menuActions = habitActions(todo, actionHandlers, { elapsedMs: elapsed });
  // The hold sheet also offers the tap action itself.
  const sheetActions = habitActions(
    todo,
    actionHandlers,
    { elapsedMs: elapsed, includeTick: true },
  );

  const detail = (() => {
    if (skipped) return todo.recurrenceType === "daily" ? "Rest day" : "Skipped this time";
    if (isTimer && !todo.completed && elapsed > 0) {
      return `${formatClock(elapsed)} / ${formatClock(goalMs)}`;
    }
    const parts = [
      todo.perWeek && todo.recurrenceType === "daily"
        ? `${Math.min(todo.thisWeek ?? 0, todo.perWeek)} of ${todo.perWeek} this week`
        : null,
      todo.durationGoal > 0 ? `${todo.durationGoal} min` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  })();

  return (
    // The whole row is a pointer target, but keyboard and screen readers use
    // the real toggle or timer button inside it, so controls are never nested.
    <div
      className={cn(
        "group relative flex min-h-[3.5rem] cursor-pointer select-none items-center [-webkit-touch-callout:none] overflow-hidden rounded-2xl px-3 py-2.5 transition-colors hover:bg-secondary/60 has-[[data-row-main]:focus-visible]:ring-2 has-[[data-row-main]:focus-visible]:ring-ring",
      )}
      onClick={(event) => {
        // A tap on the hold sheet's backdrop (a portal) bubbles here through React.
        if (event.currentTarget.contains(event.target as Node)) activate();
      }}
      {...longPress}
      onKeyDown={(event) => {
        if (event.key === "F2" && !renaming) {
          event.preventDefault();
          startRename();
        }
      }}
    >
      {isTimer && !todo.completed && fraction > 0 && (
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 z-0 bg-rating/10 transition-[width] duration-1000 ease-linear"
          style={{ width: `${fraction * 100}%` }}
        />
      )}

      <div className="relative z-10 flex min-w-0 flex-1 items-center">
        {handle}
        {isTimer && !todo.completed ? (
          <button
            type="button"
            data-row-main
            onClick={(event) => {
              event.stopPropagation();
              startOrPause();
            }}
            aria-label={running ? `Pause timer for ${todo.text}` : `Start timer for ${todo.text}`}
            className="relative mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-foreground focus-visible:outline-none"
          >
            <ProgressRing fraction={fraction} />
            {running ? (
              <Pause className="relative h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="relative ml-0.5 h-3.5 w-3.5 fill-current" />
            )}
          </button>
        ) : (
          <button
            type="button"
            data-row-main
            aria-pressed={todo.completed}
            aria-label={`${todo.completed ? "Mark not done" : "Complete"}: ${todo.text}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(todo._id);
            }}
            className={cn(
              "ml-1.5 mr-[1.125rem] flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200 focus-visible:outline-none before:absolute before:-inset-2.5 relative",
              todo.completed
                ? "border-raised bg-raised"
                : skipped
                  ? "border-dashed border-muted-foreground/60"
                  : due?.tone === "overdue"
                  ? "border-destructive group-hover:bg-destructive/15"
                  : "border-muted-foreground/70 group-hover:border-foreground",
            )}
          >
            {todo.completed && <Check className="check-pop h-3 w-3 text-foreground" strokeWidth={3} />}
            {skipped && <span className="h-[1.5px] w-2 rounded-full bg-muted-foreground" />}
          </button>
        )}

        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="flex min-w-0 flex-col">
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
                className="-mx-1 rounded-lg border border-ring bg-background px-1.5 font-serif text-[1.1875rem] text-foreground outline-none"
              />
            ) : (
              <span
                className={cn(
                  "flex min-w-0 items-center gap-2 truncate font-serif text-[1.1875rem] leading-snug",
                  todo.completed
                    ? "text-muted-foreground line-through decoration-muted-foreground/60"
                    : skipped
                      ? "text-muted-foreground"
                      : "text-foreground",
                )}
              >
                {todo.icon && <AppIcon name={todo.icon} className="h-[1.05rem] w-[1.05rem] text-soft" />}
                <span className="truncate">{todo.text}</span>
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
            {renderTrailing?.(todo)}
            {isRecurring && !renderTrailing && (
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
              className="ml-1 rounded-full p-1.5 text-muted-foreground opacity-0 transition duration-200 hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 touch:opacity-100"
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
              if (renaming) event.preventDefault();
            }}
          >
            {menuActions.map(({ key, label, icon: Icon, onSelect, destructive }) => (
              <div key={key}>
                {destructive && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={destructive ? "text-destructive focus:text-destructive" : undefined}
                  onClick={onSelect}
                >
                  <Icon className="mr-2 h-3.5 w-3.5" />
                  {label}
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={todo.text}
        description={habitSummary(todo)}
        actions={sheetActions}
      />
    </div>
  );
}

export default TodoItem;
