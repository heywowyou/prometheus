import type { Todo } from "./types/todo-types";

/**
 * Due dates are plain calendar days (`YYYY-MM-DD`), compared with the local
 * date — never converted through a time zone, so "due Friday" stays Friday.
 */

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` for a local date. */
export const toDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

/** The local day `days` after `from`. */
export const dayKeyFromToday = (days: number, from: Date = new Date()): string => {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return toDayKey(date);
};

const parseKey = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};

/** Whole days from `today` to `key` (negative = in the past). */
export const daysUntil = (key: string, today: Date = new Date()): number => {
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const due = parseKey(key);
  return Math.round((Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) - start) / DAY_MS);
};

export type DueTone = "overdue" | "today" | "soon" | "later";

export interface DueLabel {
  label: string;
  tone: DueTone;
}

/** "Overdue · 3 Nov", "Today", "Tomorrow", "Fri", "14 Nov", "3 Jan 2027". */
export const describeDue = (key: string, today: Date = new Date()): DueLabel => {
  const days = daysUntil(key, today);
  const date = parseKey(key);
  const short = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });

  if (days < 0) return { label: `Overdue · ${short}`, tone: "overdue" };
  if (days === 0) return { label: "Today", tone: "today" };
  if (days === 1) return { label: "Tomorrow", tone: "soon" };
  if (days < 7) {
    return { label: date.toLocaleDateString(undefined, { weekday: "long" }), tone: "soon" };
  }
  return { label: short, tone: "later" };
};

export const isOverdue = (todo: Todo, today: Date = new Date()): boolean =>
  !todo.completed && Boolean(todo.dueDate) && daysUntil(todo.dueDate as string, today) < 0;

/**
 * Order for open tasks: dated one-time tasks by due day (overdue first), then
 * undated ones newest first; recurring tasks alphabetically.
 */
export const compareOpenTodos = (a: Todo, b: Todo): number => {
  if (a.recurrenceType === "none" && b.recurrenceType === "none") {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
  return a.text.localeCompare(b.text);
};

/**
 * Order within a dashboard section: the user's manual (dragged) order. Tasks
 * that were never placed — older data — come first in the automatic order;
 * new tasks get a position at the bottom from the API.
 */
export const compareSectionTodos = (a: Todo, b: Todo): number => {
  const aPlaced = typeof a.order === "number";
  const bPlaced = typeof b.order === "number";
  if (aPlaced && bPlaced) return (a.order as number) - (b.order as number);
  if (aPlaced) return 1;
  if (bPlaced) return -1;
  return compareOpenTodos(a, b);
};
