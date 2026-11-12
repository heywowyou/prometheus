import type { CreateTodoPayload } from "./api/todos-api";
import { MAX_DURATION_GOAL, type RecurrenceType } from "./types/todo-types";

/** "Read 30m", "Run 45 min", "Piano 1h" → a timed task; anything else is a checkbox. */
const DURATION_SUFFIX = /\s+(\d{1,4})\s*(m|min|mins|minutes|h|hr|hrs|hours?)$/i;

export const parseQuickAdd = (
  raw: string,
  recurrenceType: RecurrenceType,
): CreateTodoPayload | null => {
  const text = raw.trim();
  if (!text) return null;

  const match = DURATION_SUFFIX.exec(text);
  const amount = match?.[1] ? Number(match[1]) : 0;
  const minutes = match?.[2]?.toLowerCase().startsWith("h") ? amount * 60 : amount;
  const title = match ? text.slice(0, match.index).trim() : text;

  if (match && title && minutes >= 1 && minutes <= MAX_DURATION_GOAL) {
    return { text: title, recurrenceType, interactionType: "timer", durationGoal: minutes };
  }
  return { text, recurrenceType, interactionType: "checkbox", durationGoal: 0 };
};
