import type { Todo } from "@features/todos/types/todo-types";
import { isRepeatRecord, isTask } from "@features/todos/types/todo-types";
import { isDay } from "@features/todos/task-views";
import { toDayKey } from "@features/todos/due";
import { COLOR_VARS, type CalendarOccurrence } from "./types/calendar-types";

/** A task with a time is drawn as a block this long. */
export const TASK_BLOCK_MINUTES = 30;

export const colorOf = (occurrence: CalendarOccurrence) => COLOR_VARS[occurrence.color] ?? COLOR_VARS.sage;

const DAY_MS = 86_400_000;

/**
 * Events drawn as bars in the all-day row rather than in the hour grid:
 * all-day events, and timed ones lasting a day or more.
 */
export const isSpanning = (occurrence: CalendarOccurrence): boolean =>
  occurrence.allDay
    ? Boolean(occurrence.startDay && occurrence.endDay)
    : new Date(occurrence.end).getTime() - new Date(occurrence.start).getTime() >= DAY_MS;

/** First and last local day an event covers. */
export const spanDays = (occurrence: CalendarOccurrence): [string, string] => {
  if (occurrence.allDay) return [occurrence.startDay as string, occurrence.endDay as string];
  const start = new Date(occurrence.start);
  // An event ending at midnight doesn't cover the day it ends on.
  const end = new Date(new Date(occurrence.end).getTime() - 1);
  return [toDayKey(start), toDayKey(end)];
};

/**
 * Tasks a calendar shows: on their start day (at their time if any), and on
 * their deadline. Not the done records of repeating tasks: those are history.
 */
export const calendarTasks = (todos: Todo[]) =>
  todos.filter((todo) => isTask(todo) && !isRepeatRecord(todo) && (isDay(todo.when) || isDay(todo.dueDate)));

export const todayKey = () => toDayKey(new Date());

/** What the calendar asks the page to do. */
export interface CalendarHandlers {
  /** Opens the new-event dialog prefilled with a time range. */
  onCreate: (draft: {
    allDay: boolean;
    startDay: string;
    endDay: string;
    startMinutes: number;
    endMinutes: number;
  }) => void;
  onOpenEvent: (occurrence: CalendarOccurrence) => void;
  onOpenTask: (todo: Todo) => void;
  onToggleTask: (todo: Todo) => void;
  /** Saves a moved or resized event. Rejects when the save fails, so the view can undo the move. */
  onChangeEvent: (
    occurrence: CalendarOccurrence,
    change: { allDay: true; startDay: string; endDay: string } | { allDay: false; start: Date; end: Date },
  ) => Promise<unknown>;
  /** Schedules a task on `day`, at `minutes` past midnight, or all day when null. */
  onScheduleTask: (todoId: string, day: string, minutes: number | null) => Promise<unknown>;
  onOpenDay: (day: string) => void;
}
