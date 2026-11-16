import type { Todo } from "@features/todos/types/todo-types";

const base = {
  userId: "u1",
  completionCount: 0,
  interactionType: "checkbox" as const,
  durationGoal: 0,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

export const habit = (id: string, text: string, extra: Partial<Todo> = {}): Todo => ({
  ...base,
  _id: id,
  text,
  recurrenceType: "daily",
  completed: false,
  skipped: false,
  ...extra,
});

export const task = (id: string, text: string, extra: Partial<Todo> = {}): Todo => ({
  ...base,
  _id: id,
  text,
  recurrenceType: "none",
  completed: false,
  ...extra,
});
