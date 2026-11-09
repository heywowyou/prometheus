import type { RecurrenceType } from "@lib/date/recurrence";

export type { RecurrenceType };

export const INTERACTION_TYPES = ["checkbox", "hold"] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

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
  completionCount: number;
  interactionType: InteractionType;
  durationGoal: number;
  paused?: boolean;
  pausedAt?: string | null;
  /** Set when a recurring task's previous completion belongs to an elapsed cycle. */
  dueAgainSince?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const RECURRENCE_GROUPS = [
  { key: "none", label: "Temporary" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const satisfies ReadonlyArray<{ key: RecurrenceType; label: string }>;
