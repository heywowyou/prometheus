import type { RepeatUnit } from "@features/todos/types/todo-types";

/** Calm hues, plus red for what is genuinely urgent. */
export const EVENT_COLORS = ["sage", "teal", "blue", "sky", "stone", "red"] as const;
export type EventColor = (typeof EVENT_COLORS)[number];

export const COLOR_NAMES: Record<EventColor, string> = {
  sage: "Sage",
  teal: "Teal",
  blue: "Blue",
  sky: "Light blue",
  stone: "Stone",
  red: "Red (urgent)",
};

/** The CSS variable each event color draws with. */
export const COLOR_VARS: Record<EventColor, string> = {
  sage: "var(--rating)",
  teal: "var(--teal)",
  blue: "var(--info)",
  sky: "var(--highlight)",
  stone: "var(--stone)",
  red: "var(--destructive)",
};

export const REMIND_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: "No reminder" },
  { value: 0, label: "At the start" },
  { value: 5, label: "5 min before" },
  { value: 10, label: "10 min before" },
  { value: 15, label: "15 min before" },
  { value: 30, label: "30 min before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
];

export interface EventRepeat {
  every: number;
  unit: RepeatUnit;
  weekdays: number[];
  until?: string | null;
}

/** One occurrence of an event, as the API expands them for a range. */
export interface CalendarOccurrence {
  /** `eventId:occurrenceDay`, unique in a range. */
  _id: string;
  eventId: string;
  occurrenceDay: string;
  title: string;
  notes: string;
  location: string;
  color: EventColor;
  allDay: boolean;
  start: string;
  end: string;
  /** All-day: first and last day, inclusive. */
  startDay?: string;
  endDay?: string;
  repeat: EventRepeat | null;
  remindMinutes: number | null;
}

export interface EventPayload {
  title?: string;
  notes?: string;
  location?: string;
  color?: EventColor;
  allDay?: boolean;
  startDay?: string;
  endDay?: string;
  start?: string;
  end?: string;
  repeat?: EventRepeat | null;
  remindMinutes?: number | null;
}

export type CalendarView = "month" | "week" | "day";
