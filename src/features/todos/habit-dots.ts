import { toDayKey } from "./due";
import type { RecurrenceType } from "./types/todo-types";

/** The last few cycles of a habit, oldest first: done or not, and a label. */
export const recentCycles = (
  recurrence: RecurrenceType,
  days: ReadonlySet<string>,
  now: Date = new Date(),
): Array<{ key: string; done: boolean; label: string }> => {
  if (recurrence === "weekly") {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(monday);
      start.setDate(start.getDate() - (5 - index) * 7);
      const keys = Array.from({ length: 7 }, (_, offset) => {
        const day = new Date(start);
        day.setDate(day.getDate() + offset);
        return toDayKey(day);
      });
      return {
        key: keys[0] as string,
        done: keys.some((key) => days.has(key)),
        label: `Week of ${start.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`,
      };
    });
  }
  if (recurrence === "monthly") {
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const prefix = toDayKey(month).slice(0, 7);
      return {
        key: prefix,
        done: [...days].some((key) => key.startsWith(prefix)),
        label: month.toLocaleDateString(undefined, { month: "long" }),
      };
    });
  }
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
    const key = toDayKey(day);
    return { key, done: days.has(key), label: day.toLocaleDateString(undefined, { weekday: "long" }) };
  });
};
