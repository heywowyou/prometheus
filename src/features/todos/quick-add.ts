import type { CreateTodoPayload } from "./api/todos-api";
import { MAX_DURATION_GOAL, type RecurrenceType } from "./types/todo-types";
import { dayKeyFromToday } from "./due";

/** "Read 30m", "Run 45 min", "Piano 1h" → a timed task; anything else is a checkbox. */
const DURATION_SUFFIX = /\s+(\d{1,4})\s*(m|min|mins|minutes|h|hr|hrs|hours?)$/i;

/** "@today", "@tomorrow", "@fri", "@2026-12-24" anywhere in the text. */
const DUE_TOKEN = /(?:^|\s)@(today|tomorrow|tmrw|mon|tue|wed|thu|fri|sat|sun|\d{4}-\d{2}-\d{2})\b/i;

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** The due day a token names; weekdays mean the next one (today counts). */
const dueFromToken = (token: string, today: Date): string => {
  const value = token.toLowerCase();
  if (value === "today") return dayKeyFromToday(0, today);
  if (value === "tomorrow" || value === "tmrw") return dayKeyFromToday(1, today);
  const weekday = WEEKDAYS.indexOf(value);
  if (weekday >= 0) return dayKeyFromToday((weekday - today.getDay() + 7) % 7, today);
  return value;
};

export const parseQuickAdd = (
  raw: string,
  recurrenceType: RecurrenceType,
  today: Date = new Date(),
): CreateTodoPayload | null => {
  let text = raw.trim();
  if (!text) return null;

  // Due dates only mean something for one-time tasks.
  let dueDate: string | undefined;
  const due = recurrenceType === "none" ? DUE_TOKEN.exec(text) : null;
  if (due?.[1]) {
    dueDate = dueFromToken(due[1], today);
    text = `${text.slice(0, due.index)} ${text.slice(due.index + due[0].length)}`
      .replace(/\s+/g, " ")
      .trim();
  }

  const match = DURATION_SUFFIX.exec(text);
  const amount = match?.[1] ? Number(match[1]) : 0;
  const minutes = match?.[2]?.toLowerCase().startsWith("h") ? amount * 60 : amount;
  const title = match ? text.slice(0, match.index).trim() : text;
  if (!title) return null;

  const timed = Boolean(match) && minutes >= 1 && minutes <= MAX_DURATION_GOAL;
  return {
    text: timed ? title : text,
    recurrenceType,
    interactionType: timed ? "timer" : "checkbox",
    durationGoal: timed ? minutes : 0,
    ...(dueDate ? { dueDate } : {}),
  };
};
