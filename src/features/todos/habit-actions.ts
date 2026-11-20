import {
  CalendarDays,
  Check,
  Coffee,
  Pause,
  PauseCircle,
  Pencil,
  Play,
  Repeat2,
  RotateCcw,
  Shredder,
  Type,
  Undo2,
} from "lucide-react";
import type { SheetAction } from "@components/ui/action-sheet";
import type { TimerAction, Todo } from "./types/todo-types";

export interface HabitActionHandlers {
  onToggle?: (id: string) => void;
  onTimer?: (id: string, action: TimerAction) => void;
  onRename?: () => void;
  onEdit?: (todo: Todo) => void;
  onSkip?: (id: string) => void;
  onHistory?: (todo: Todo) => void;
  onPause?: (id: string) => void;
  onConvert?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
}

const skipLabel = (todo: Todo) =>
  todo.skipped
    ? "Undo skip"
    : todo.recurrenceType === "daily"
      ? "Skip today"
      : todo.recurrenceType === "weekly"
        ? "Skip this week"
        : "Skip this month";

/**
 * Everything a habit offers, in menu order. `includeTick` adds the tap action
 * itself (done / not done, start / pause) for surfaces where the menu is the
 * only way to reach it explicitly, like the phone's press-and-hold sheet.
 */
export function habitActions(
  todo: Todo,
  handlers: HabitActionHandlers,
  { elapsedMs = 0, includeTick = false }: { elapsedMs?: number; includeTick?: boolean } = {},
): SheetAction[] {
  const actions: SheetAction[] = [];
  const isRecurring = todo.recurrenceType !== "none";
  const isTimer = todo.interactionType === "timer" && Boolean(handlers.onTimer);
  const running = isTimer && Boolean(todo.timer?.startedAt) && !todo.completed;
  const { onToggle, onTimer } = handlers;

  if (includeTick && isTimer && !todo.completed && onTimer) {
    actions.push({
      key: "timer",
      label: running ? "Pause timer" : "Start timer",
      icon: running ? Pause : Play,
      onSelect: () => onTimer(todo._id, running ? "pause" : "start"),
    });
  }
  if (onToggle && (todo.completed ? includeTick : isTimer || includeTick)) {
    actions.push({
      key: "toggle",
      label: todo.completed ? "Mark not done" : "Mark done",
      icon: todo.completed ? Undo2 : Check,
      onSelect: () => onToggle(todo._id),
    });
  }
  if (isRecurring && handlers.onSkip && !todo.completed) {
    const onSkip = handlers.onSkip;
    actions.push({ key: "skip", label: skipLabel(todo), icon: Coffee, onSelect: () => onSkip(todo._id) });
  }
  if (isTimer && !todo.completed && elapsedMs > 0 && onTimer) {
    actions.push({ key: "reset", label: "Reset timer", icon: RotateCcw, onSelect: () => onTimer(todo._id, "reset") });
  }
  if (handlers.onRename) actions.push({ key: "rename", label: "Rename", icon: Type, onSelect: handlers.onRename });
  if (handlers.onEdit) {
    const onEdit = handlers.onEdit;
    actions.push({ key: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(todo) });
  }
  if (isRecurring && handlers.onHistory) {
    const onHistory = handlers.onHistory;
    actions.push({ key: "history", label: "History", icon: CalendarDays, onSelect: () => onHistory(todo) });
  }
  if (isRecurring && handlers.onPause) {
    const onPause = handlers.onPause;
    actions.push({ key: "pause", label: "Pause", icon: PauseCircle, onSelect: () => onPause(todo._id) });
  }
  if (isRecurring && handlers.onConvert) {
    const onConvert = handlers.onConvert;
    actions.push({ key: "convert", label: "Turn into a repeating task", icon: Repeat2, onSelect: () => onConvert(todo) });
  }
  if (handlers.onDelete) {
    const onDelete = handlers.onDelete;
    actions.push({ key: "delete", label: "Delete", icon: Shredder, onSelect: () => onDelete(todo), destructive: true, confirm: false });
  }
  return actions;
}

/** One quiet line under the habit's name in its hold sheet. */
export function habitSummary(todo: Todo): string | undefined {
  if (todo.recurrenceType === "none") return undefined;
  const cadence =
    todo.recurrenceType === "daily"
      ? todo.perWeek
        ? `${Math.min(todo.thisWeek ?? 0, todo.perWeek)} of ${todo.perWeek} this week`
        : "Every day"
      : todo.recurrenceType === "weekly"
        ? "Once a week"
        : "Once a month";
  const state = todo.completed ? "done" : todo.skipped ? "resting" : null;
  return [cadence, state].filter(Boolean).join(" · ");
}
