import type { EventInput } from "@fullcalendar/core";
import { toDayKey } from "@features/todos/due";
import type { Todo } from "@features/todos/types/todo-types";
import { addDaysKey, hhmm, minutesFromHhmm } from "./calendar-dates";
import { TASK_BLOCK_MINUTES, colorOf, isSpanning, todayKey } from "./calendar-items";
import type { CalendarOccurrence } from "./types/calendar-types";

export const TIME_FORMAT = { hour: "2-digit", minute: "2-digit", hour12: false } as const;

/** What each FullCalendar event stands for, in `extendedProps.item`. */
export type Item =
  | { kind: "event"; occurrence: CalendarOccurrence; spanningTimed: boolean }
  | { kind: "task"; todo: Todo; deadline: boolean };

/** Events and tasks as FullCalendar inputs. Data stays ours; FullCalendar only draws it. */
export const toInputs = (events: CalendarOccurrence[], todos: Todo[]): EventInput[] => {
  const inputs: EventInput[] = [];
  for (const occurrence of events) {
    const color = colorOf(occurrence);
    const common = {
      id: occurrence._id,
      title: occurrence.title || "Untitled",
      backgroundColor: `color-mix(in srgb, ${color} 30%, var(--card))`,
      borderColor: color,
      textColor: "var(--foreground)",
      classNames: ["px-event"],
    };
    if (occurrence.allDay && occurrence.startDay && occurrence.endDay) {
      inputs.push({
        ...common,
        allDay: true,
        start: occurrence.startDay,
        // FullCalendar's all-day end is exclusive.
        end: addDaysKey(occurrence.endDay, 1),
        extendedProps: { item: { kind: "event", occurrence, spanningTimed: false } satisfies Item },
      });
    } else if (isSpanning(occurrence)) {
      // A timed event of a day or more reads best as a bar on top, like all-day ones.
      const start = new Date(occurrence.start);
      const end = new Date(new Date(occurrence.end).getTime() - 1);
      inputs.push({
        ...common,
        allDay: true,
        start: toDayKey(start),
        end: addDaysKey(toDayKey(end), 1),
        durationEditable: false,
        extendedProps: { item: { kind: "event", occurrence, spanningTimed: true } satisfies Item },
      });
    } else {
      inputs.push({
        ...common,
        allDay: false,
        start: occurrence.start,
        end: occurrence.end,
        extendedProps: { item: { kind: "event", occurrence, spanningTimed: false } satisfies Item },
      });
    }
  }
  for (const todo of todos) {
    const base = {
      title: todo.text || "New task",
      classNames: ["px-task", todo.completed ? "px-task-done" : ""],
      backgroundColor: "transparent",
      borderColor: "var(--border)",
      textColor: "var(--soft-foreground)",
      durationEditable: false,
    };
    if (todo.when && /^\d{4}-\d{2}-\d{2}$/.test(todo.when)) {
      if (todo.time) {
        const startMinutes = minutesFromHhmm(todo.time);
        inputs.push({
          ...base,
          id: `task-${todo._id}`,
          allDay: false,
          start: `${todo.when}T${todo.time}:00`,
          end: `${todo.when}T${hhmm(Math.min(24 * 60 - 1, startMinutes + TASK_BLOCK_MINUTES))}:00`,
          extendedProps: { item: { kind: "task", todo, deadline: false } satisfies Item },
        });
      } else {
        inputs.push({
          ...base,
          id: `task-${todo._id}`,
          allDay: true,
          start: todo.when,
          extendedProps: { item: { kind: "task", todo, deadline: false } satisfies Item },
        });
      }
    }
    if (todo.dueDate && todo.dueDate !== todo.when && !todo.completed) {
      const overdue = todo.dueDate < todayKey();
      inputs.push({
        ...base,
        id: `due-${todo._id}`,
        allDay: true,
        start: todo.dueDate,
        editable: false,
        textColor: overdue ? "var(--destructive)" : "var(--muted-foreground)",
        borderColor: overdue ? "color-mix(in srgb, var(--destructive) 50%, transparent)" : "var(--border)",
        classNames: ["px-task", "px-deadline", overdue ? "px-overdue" : ""],
        extendedProps: { item: { kind: "task", todo, deadline: true } satisfies Item },
      });
    }
  }
  return inputs;
};

