import { toDayKey } from "@features/todos/due";

/** Calendar math on local days (`YYYY-MM-DD`) and local times. Weeks start on Monday. */

export const parseDay = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};

export const addDaysKey = (key: string, days: number): string => {
  const date = parseDay(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
};

export const startOfWeek = (key: string): string => {
  const date = parseDay(key);
  const offset = (date.getDay() + 6) % 7;
  return addDaysKey(key, -offset);
};

export const startOfMonth = (key: string): string => `${key.slice(0, 7)}-01`;

export const addMonthsKey = (key: string, months: number): string => {
  const date = parseDay(key);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), last));
  return toDayKey(target);
};

/** The 6 weeks (42 days) shown for the month containing `key`. */
export const monthGrid = (key: string): string[] => {
  const first = startOfWeek(startOfMonth(key));
  return Array.from({ length: 42 }, (_, index) => addDaysKey(first, index));
};

export const weekDays = (key: string): string[] => {
  const first = startOfWeek(key);
  return Array.from({ length: 7 }, (_, index) => addDaysKey(first, index));
};

/** Minutes since local midnight of `date`. */
export const minutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

/** A local Date on `day` at `minutes` past midnight. */
export const atMinutes = (day: string, minutes: number): Date => {
  const date = parseDay(day);
  date.setMinutes(minutes);
  return date;
};

export const hhmm = (minutes: number): string =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const minutesFromHhmm = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

/** "09:30", 24-hour, in the browser locale. */
export const formatTime = (date: Date): string =>
  date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export const isWeekend = (key: string): boolean => {
  const day = parseDay(key).getDay();
  return day === 0 || day === 6;
};
