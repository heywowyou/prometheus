import type { RecurrenceType } from "../../../lib/date/recurrence";
export type { RecurrenceType };

export interface Todo {
  _id: string;
  text: string;
  completed: boolean;
  recurrenceType: RecurrenceType;
  lastCompletedAt?: string | null;
  completionCount: number;
  interactionType: "checkbox" | "hold";
  durationGoal: number;
  paused?: boolean;
  pausedAt?: string | null;
  userId: string;
}

