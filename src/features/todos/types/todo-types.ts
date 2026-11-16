import type { RecurrenceType } from "@lib/date/recurrence";

export type { RecurrenceType };

/** A plain checkbox, or a timer that completes once `durationGoal` minutes are spent. */
export const INTERACTION_TYPES = ["checkbox", "timer"] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const MAX_DURATION_GOAL = 24 * 60;

export interface Streak {
  /** Consecutive cycles completed, up to now (an open cycle doesn't break it). */
  current: number;
  best: number;
}

export interface TodoTimer {
  /** Progress banked this cycle, in ms. */
  elapsedMs: number;
  /** Set while running; live time is `elapsedMs + (now − startedAt)`. */
  startedAt?: string | null;
}

export const REPEAT_UNITS = ["day", "week", "month", "year"] as const;
export type RepeatUnit = (typeof REPEAT_UNITS)[number];

export interface RepeatRule {
  every: number;
  unit: RepeatUnit;
  /** Weekly only: 0 = Sunday … 6 = Saturday; empty = same weekday. */
  weekdays: number[];
  /** `fixed`: on schedule; `afterCompletion`: counted from the day it's done. */
  mode: "fixed" | "afterCompletion";
}

export interface ChecklistItem {
  _id?: string;
  text: string;
  done: boolean;
}

export interface Todo {
  _id: string;
  text: string;
  /**
   * Live completion state. The API already accounts for recurrence rollover,
   * so a daily task completed yesterday arrives as `completed: false`.
   */
  completed: boolean;
  recurrenceType: RecurrenceType;
  lastCompletedAt?: string | null;
  /** Total completions ever — not a streak. */
  completionCount: number;
  interactionType: InteractionType;
  /** Target minutes: required for timers, a hint for checkboxes. */
  durationGoal: number;
  /** Timer tasks only. */
  timer?: TodoTimer;
  /** Recurring tasks only. */
  streak?: Streak;
  /** Habits: the current cycle (day, week or month) was skipped on purpose. */
  skipped?: boolean;
  /** Habits: skipped cycles, by their first day `YYYY-MM-DD`. */
  skips?: string[];
  /** Daily habits: days a week to aim for (1-6); null or absent = every day. */
  perWeek?: number | null;
  /** Daily habits with `perWeek`: days done this week. */
  thisWeek?: number;
  /** One-time tasks only: the day it's due, `YYYY-MM-DD`. */
  dueDate?: string | null;
  /** Manual position within its section, set by drag and drop. */
  order?: number | null;
  paused?: boolean;
  pausedAt?: string | null;
  /** Set when a recurring task's previous completion belongs to an elapsed cycle. */
  dueAgainSince?: string | null;

  /* Tasks (recurrenceType "none"); habits are the recurring ones. */
  notes?: string;
  checklist?: ChecklistItem[];
  areaId?: string | null;
  projectId?: string | null;
  headingId?: string | null;
  tags?: string[];
  important?: boolean;
  /** `YYYY-MM-DD`, `someday`, or unset (Inbox, or Anytime inside a list). */
  when?: string | null;
  /** In This Evening on the `when` day. */
  evening?: boolean;
  /** `HH:mm`; a reminder fires then on the `when` day. */
  time?: string | null;
  reminderAt?: string | null;
  repeat?: RepeatRule | null;
  completedAt?: string | null;
  /** On a done copy of a repeating task: the task it came from. */
  repeatOf?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type TimerAction = "start" | "pause" | "reset";

export interface TodoHistory {
  streak: Streak;
  /** Skipped cycles, by their first day. */
  skips?: string[];
  total: number;
  /** Completions per local day (`YYYY-MM-DD`), only days with any. */
  days: Array<{ date: string; count: number }>;
}

export const RECURRENCE_GROUPS = [
  { key: "none", label: "Temporary" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const satisfies ReadonlyArray<{ key: RecurrenceType; label: string }>;

/** Live timer progress in ms at `now`. */
export const timerElapsedMs = (todo: Todo, now: number): number => {
  if (!todo.timer) return 0;
  const running = todo.timer.startedAt ? now - new Date(todo.timer.startedAt).getTime() : 0;
  return todo.timer.elapsedMs + Math.max(0, running);
};

export interface TodoArea {
  _id: string;
  title: string;
  order: number;
}

export interface TodoHeading {
  _id: string;
  title: string;
}

export interface TodoProject {
  _id: string;
  title: string;
  notes: string;
  areaId?: string | null;
  order: number;
  headings: TodoHeading[];
  /** `someday` parks the project. */
  when?: string | null;
  /** Deadline, `YYYY-MM-DD`. */
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
}

export interface TodoLists {
  areas: TodoArea[];
  projects: TodoProject[];
}

export interface LogbookPage {
  tasks: Todo[];
  projects: TodoProject[];
}

/** A task, as opposed to a habit (a recurring todo). */
export const isTask = (todo: Todo): boolean => todo.recurrenceType === "none";
