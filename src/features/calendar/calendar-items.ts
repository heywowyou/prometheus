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

/** Something drawn in a day's all-day row (or a month cell). */
export type DayItem =
  | { kind: "event"; key: string; occurrence: CalendarOccurrence; continues: boolean }
  | { kind: "task"; key: string; todo: Todo; deadline: boolean };

export const TASK_BLOCK_MINUTES = 30;
/** Height of one hour in the week and day grids. */
export const HOUR_PX = 48;
/** Drag-and-drop type for a task dragged onto the calendar. */
export const TASK_MIME = "application/x-prometheus-task";

export const colorOf = (occurrence: CalendarOccurrence) => COLOR_VARS[occurrence.color] ?? COLOR_VARS.sage;

/** Tasks a calendar shows: on their start day (at their time if any), and on their deadline. */
export const calendarTasks = (todos: Todo[]) =>
  todos.filter((todo) => isTask(todo) && (isDay(todo.when) || isDay(todo.dueDate)));

/** The parts of each timed event and timed task falling on `day`, in minutes. */
export const timedItemsOn = (day: string, events: CalendarOccurrence[], todos: Todo[]): TimedItem[] => {
  const dayStart = parseDay(day).getTime();
  const dayEnd = parseDay(addDaysKey(day, 1)).getTime();
  const items: TimedItem[] = [];
  for (const occurrence of events) {
    if (occurrence.allDay) continue;
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

/** All-day events covering `day`, and untimed tasks starting or due that day. */
export const dayItemsOn = (day: string, events: CalendarOccurrence[], todos: Todo[]): DayItem[] => {
  const items: DayItem[] = [];
  for (const occurrence of events) {
    if (!occurrence.allDay || !occurrence.startDay || !occurrence.endDay) continue;
    if (occurrence.startDay <= day && occurrence.endDay >= day) {
      items.push({ kind: "event", key: `${occurrence._id}@${day}`, occurrence, continues: occurrence.startDay !== day });
    }
  }
  for (const todo of todos) {
    if (todo.when === day && !todo.time) items.push({ kind: "task", key: `task-${todo._id}`, todo, deadline: false });
    else if (todo.dueDate === day && todo.when !== day && !todo.completed) {
      items.push({ kind: "task", key: `due-${todo._id}`, todo, deadline: true });
    }
  }
  return items;
};

/** Timed events for a month cell, as short labelled items after the all-day ones. */
export const monthItemsOn = (day: string, events: CalendarOccurrence[], todos: Todo[]) => [
  ...dayItemsOn(day, events, todos),
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
