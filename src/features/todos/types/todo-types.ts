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
  paused?: boolean;
  pausedAt?: string | null;
  /** Set when a recurring task's previous completion belongs to an elapsed cycle. */
  dueAgainSince?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type TimerAction = "start" | "pause" | "reset";

export interface TodoHistory {
  streak: Streak;
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
