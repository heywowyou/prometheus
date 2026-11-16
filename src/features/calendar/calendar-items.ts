import type { Todo } from "@features/todos/types/todo-types";
import { isTask } from "@features/todos/types/todo-types";
import { isDay } from "@features/todos/task-views";
import { toDayKey } from "@features/todos/due";
import { addDaysKey, minutesFromHhmm, minutesOfDay, parseDay } from "./calendar-dates";
import { COLOR_VARS, type CalendarOccurrence } from "./types/calendar-types";

/** Something drawn in the hour grid on one day. */
export type TimedItem =
  | { kind: "event"; key: string; day: string; start: number; end: number; occurrence: CalendarOccurrence }
  | { kind: "task"; key: string; day: string; start: number; end: number; todo: Todo };

/** A task drawn in a day's all-day row (or a month cell): on its start day, or its deadline. */
export type DayItem = { kind: "task"; key: string; todo: Todo; deadline: boolean };

export const TASK_BLOCK_MINUTES = 30;
/** Height of one hour in the week and day grids. */
export const HOUR_PX = 48;
/** Drag-and-drop type for a task dragged onto the calendar. */
export const TASK_MIME = "application/x-prometheus-task";

export const colorOf = (occurrence: CalendarOccurrence) => COLOR_VARS[occurrence.color] ?? COLOR_VARS.sage;

const DAY_MS = 86_400_000;

/**
 * Events drawn as bars above the hours (or across a month row) rather than in
 * the grid: all-day events, and timed ones lasting a day or more.
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

/** One event as a single bar across consecutive day columns. */
export interface SpanBar {
  key: string;
  occurrence: CalendarOccurrence;
  /** Columns in `days`, inclusive. */
  startCol: number;
  endCol: number;
  lane: number;
  /** The event goes on beyond the shown days. */
  continuesBefore: boolean;
  continuesAfter: boolean;
}

/**
 * Lays spanning events over a run of consecutive `days` (a week, or one day):
 * each gets one bar, stacked in lanes so bars never overlap. Longer events
 * take the upper lanes.
 */
export const spanBars = (days: string[], events: CalendarOccurrence[]): { bars: SpanBar[]; lanes: number } => {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return { bars: [], lanes: 0 };
  const index = new Map(days.map((day, position) => [day, position]));
  const candidates = events
    .filter(isSpanning)
    .map((occurrence) => ({ occurrence, span: spanDays(occurrence) }))
    .filter(({ span }) => span[0] <= last && span[1] >= first)
    .sort(
      (a, b) =>
        a.span[0].localeCompare(b.span[0]) ||
        b.span[1].localeCompare(a.span[1]) ||
        a.occurrence.title.localeCompare(b.occurrence.title),
    );
  const laneEnds: number[] = [];
  const bars: SpanBar[] = [];
  for (const { occurrence, span } of candidates) {
    const startCol = span[0] < first ? 0 : (index.get(span[0]) ?? 0);
    const endCol = span[1] > last ? days.length - 1 : (index.get(span[1]) ?? days.length - 1);
    let lane = laneEnds.findIndex((end) => end < startCol);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(endCol);
    } else {
      laneEnds[lane] = endCol;
    }
    bars.push({
      key: `${occurrence._id}@${first}`,
      occurrence,
      startCol,
      endCol,
      lane,
      continuesBefore: span[0] < first,
      continuesAfter: span[1] > last,
    });
  }
  return { bars, lanes: laneEnds.length };
};

/** Tasks a calendar shows: on their start day (at their time if any), and on their deadline. */
export const calendarTasks = (todos: Todo[]) =>
  todos.filter((todo) => isTask(todo) && (isDay(todo.when) || isDay(todo.dueDate)));

/** The parts of each timed event and timed task falling on `day`, in minutes. */
export const timedItemsOn = (day: string, events: CalendarOccurrence[], todos: Todo[]): TimedItem[] => {
  const dayStart = parseDay(day).getTime();
  const dayEnd = parseDay(addDaysKey(day, 1)).getTime();
  const items: TimedItem[] = [];
  for (const occurrence of events) {
    if (occurrence.allDay || isSpanning(occurrence)) continue;
    const start = new Date(occurrence.start).getTime();
    const end = new Date(occurrence.end).getTime();
    if (end <= dayStart || start >= dayEnd) continue;
    items.push({
      kind: "event",
      key: `${occurrence._id}@${day}`,
      day,
      start: start <= dayStart ? 0 : minutesOfDay(new Date(start)),
      end: end >= dayEnd ? 24 * 60 : Math.max(minutesOfDay(new Date(end)), 15),
      occurrence,
    });
  }
  for (const todo of todos) {
    if (todo.when !== day || !todo.time) continue;
    const start = minutesFromHhmm(todo.time);
    items.push({ kind: "task", key: `task-${todo._id}`, day, start, end: Math.min(24 * 60, start + TASK_BLOCK_MINUTES), todo });
  }
  return items.sort((a, b) => a.start - b.start || b.end - a.end);
};

/** Untimed tasks starting or due on `day`. (All-day events are bars: see `spanBars`.) */
export const dayItemsOn = (day: string, todos: Todo[]): DayItem[] => {
  const items: DayItem[] = [];
  for (const todo of todos) {
    if (todo.when === day && !todo.time) items.push({ kind: "task", key: `task-${todo._id}`, todo, deadline: false });
    else if (todo.dueDate === day && todo.when !== day && !todo.completed) {
      items.push({ kind: "task", key: `due-${todo._id}`, todo, deadline: true });
    }
  }
  return items;
};

/** A month cell's own items: untimed tasks, then timed events and tasks. */
export const monthItemsOn = (day: string, events: CalendarOccurrence[], todos: Todo[]) => [
  ...dayItemsOn(day, todos),
  ...timedItemsOn(day, events, todos),
];

export interface Placed<T> {
  item: T;
  lane: number;
  lanes: number;
}

/**
 * Side-by-side layout for overlapping blocks: each cluster of overlapping
 * items is split into as many lanes as it needs at most.
 */
export const layoutLanes = <T extends { start: number; end: number }>(items: T[]): Array<Placed<T>> => {
  const placed: Array<Placed<T>> = [];
  let cluster: Array<Placed<T>> = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const close = () => {
    for (const entry of cluster) entry.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };
  for (const item of items) {
    if (item.start >= clusterEnd) close();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    const entry = { item, lane, lanes: 1 };
    cluster.push(entry);
    placed.push(entry);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  close();
  return placed;
};

export const todayKey = () => toDayKey(new Date());
