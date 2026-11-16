import { toDayKey } from "./due";
import type { RecurrenceType } from "./types/todo-types";

export type CycleState = "done" | "skipped" | "open" | "future";

export interface Cycle {
  key: string;
  state: CycleState;
  label: string;
  /** Single-letter weekday, for daily habits. */
  short?: string;
}

const mondayOf = (now: Date) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));

const STATE_WORD: Record<CycleState, string> = {
  done: "done",
  skipped: "rest",
  open: "not done",
  future: "to come",
};

export const describeCycle = (cycle: Cycle) => `${cycle.label}: ${STATE_WORD[cycle.state]}`;

/**
 * A habit's recent cycles, oldest first. Daily habits show this week, Monday
 * to Sunday, so every week starts fresh; weekly and monthly ones show the
 * last six weeks or months. Skipped cycles (`skips`, by their first day) read
 * as rest, not as misses.
 */
export const recentCycles = (
  recurrence: RecurrenceType,
  days: ReadonlySet<string>,
  skips: readonly string[] = [],
  now: Date = new Date(),
): Cycle[] => {
  const skipped = new Set(skips);
  const today = toDayKey(now);

  if (recurrence === "weekly") {
    const monday = mondayOf(now);
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(monday);
      start.setDate(start.getDate() - (5 - index) * 7);
      const keys = Array.from({ length: 7 }, (_, offset) => {
        const day = new Date(start);
        day.setDate(day.getDate() + offset);
        return toDayKey(day);
      });
      const key = keys[0] as string;
      return {
        key,
        state: keys.some((day) => days.has(day)) ? "done" : skipped.has(key) ? "skipped" : "open",
        label: `Week of ${start.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`,
      };
    });
  }
  if (recurrence === "monthly") {
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const prefix = toDayKey(month).slice(0, 7);
      const key = `${prefix}-01`;
      return {
        key,
        state: [...days].some((day) => day.startsWith(prefix)) ? "done" : skipped.has(key) ? "skipped" : "open",
        label: month.toLocaleDateString(undefined, { month: "long" }),
      };
    });
  }
  const monday = mondayOf(now);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const key = toDayKey(day);
    const state: CycleState = days.has(key)
      ? "done"
      : skipped.has(key)
        ? "skipped"
        : key > today
          ? "future"
          : "open";
    return {
      key,
      state,
      label: day.toLocaleDateString(undefined, { weekday: "long" }),
      short: day.toLocaleDateString(undefined, { weekday: "narrow" }),
    };
  });
};
