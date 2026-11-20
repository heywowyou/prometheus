import { useEffect, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  DayHeaderContentArg,
} from "@fullcalendar/core";
import type { DateClickArg, DropArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import { Check, Flag } from "lucide-react";
import { cn } from "@lib/utils";
import { haptic } from "@lib/haptics";
import { toDayKey } from "@features/todos/due";
import type { Todo } from "@features/todos/types/todo-types";
import { minutesOfDay, hhmm } from "../calendar-dates";
import { colorOf, todayKey, type CalendarHandlers } from "../calendar-items";
import type { CalendarOccurrence, CalendarView as View } from "../types/calendar-types";
import { TIME_FORMAT, toInputs, type Item } from "../calendar-inputs";
import "../fullcalendar.css";

const FC_VIEWS: Record<View, string> = {
  month: "dayGridMonth",
  week: "timeGridWeek",
  day: "timeGridDay",
};

function EventContent({ arg, onToggleTask }: { arg: EventContentArg; onToggleTask: (todo: Todo) => void }) {
  const item = arg.event.extendedProps.item as Item | undefined;
  // The preview while selecting a time or dragging a task in from the tray.
  if (!item) {
    return (
      <span className="flex min-w-0 flex-col overflow-hidden px-1">
        <span className="truncate font-medium">{arg.event.title || "New event"}</span>
        {arg.timeText && <span className="tabular-nums text-soft">{arg.timeText}</span>}
      </span>
    );
  }
  if (item.kind === "task") {
    const { todo } = item;
    return (
      <span className="flex min-w-0 items-center gap-1.5 overflow-hidden px-1">
        {item.deadline ? (
          <Flag className="h-3 w-3 shrink-0" aria-label="Deadline" />
        ) : (
          <button
            type="button"
            aria-label={todo.completed ? `Reopen ${todo.text}` : `Complete ${todo.text}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleTask(todo);
            }}
            className={cn(
              "flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border",
              todo.completed ? "border-rating bg-rating text-rating-foreground" : "border-muted-foreground",
            )}
          >
            {todo.completed && <Check className="h-2 w-2" strokeWidth={4} />}
          </button>
        )}
        {arg.timeText && !arg.event.allDay && <span className="shrink-0 tabular-nums text-muted-foreground">{arg.timeText}</span>}
        <span className={cn("truncate", todo.completed && "line-through")}>{todo.text}</span>
      </span>
    );
  }
  const { occurrence, spanningTimed } = item;
  const time = spanningTimed
    ? new Date(occurrence.start).toLocaleTimeString(undefined, TIME_FORMAT)
    : !arg.event.allDay
      ? arg.timeText
      : "";
  const timed = !arg.event.allDay && arg.view.type !== "dayGridMonth";
  return (
    <span className={cn("flex min-w-0 overflow-hidden px-1", timed ? "flex-col" : "items-center gap-1.5")}>
      {arg.view.type === "dayGridMonth" && !arg.event.allDay && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colorOf(occurrence) }} />
      )}
      {time && !timed && <span className="shrink-0 tabular-nums text-soft">{time}</span>}
      <span className="truncate font-medium">{occurrence.title || "Untitled"}</span>
      {timed && (
        <span className="truncate tabular-nums text-soft">
          {time}
          {occurrence.location ? ` · ${occurrence.location}` : ""}
        </span>
      )}
    </span>
  );
}

function DayHeader({ arg }: { arg: DayHeaderContentArg }) {
  if (arg.view.type === "dayGridMonth") {
    return <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{arg.text}</span>;
  }
  return (
    <span className="flex items-baseline justify-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {arg.date.toLocaleDateString(undefined, { weekday: "short" })}
      </span>
      <span
        className={cn(
          "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm tabular-nums",
          arg.isToday ? "bg-rating font-semibold text-rating-foreground" : "text-foreground",
        )}
      >
        {arg.date.getDate()}
      </span>
    </span>
  );
}

/** Where the hour grid opens: around now on today, otherwise the morning. */
const scrollTimeFor = (view: View, cursor: string) => {
  const now = new Date();
  const minutes = minutesOfDay(now);
  const showsToday = view === "day" ? cursor === todayKey() : true;
  const target = showsToday && minutes >= 6 * 60 ? minutes - 90 : 7 * 60;
  return `${hhmm(Math.max(0, target))}:00`;
};

/**
 * Month, week and day views drawn by FullCalendar: drag on empty time to
 * create, drag events and tasks to move them, drag an event's edge to resize,
 * click to open. Tasks without a day can be dropped in from the tray.
 */
export default function CalendarView({
  view,
  cursor,
  events,
  todos,
  handlers,
}: {
  view: View;
  cursor: string;
  events: CalendarOccurrence[];
  todos: Todo[];
  handlers: CalendarHandlers;
}) {
  const ref = useRef<FullCalendar>(null);
  const inputs = useMemo(() => toInputs(events, todos), [events, todos]);

  // The page owns view and date (they live in the URL); keep FullCalendar in step.
  useEffect(() => {
    const api = ref.current?.getApi();
    if (!api) return;
    if (api.view.type !== FC_VIEWS[view]) api.changeView(FC_VIEWS[view], cursor);
    else api.gotoDate(cursor);
    if (view !== "month") api.scrollToTime(scrollTimeFor(view, cursor));
  }, [view, cursor]);

  const select = (arg: DateSelectArg) => {
    arg.view.calendar.unselect();
    if (arg.allDay) {
      handlers.onCreate({
        allDay: true,
        startDay: toDayKey(arg.start),
        endDay: toDayKey(new Date(arg.end.getTime() - 1)),
        startMinutes: 9 * 60,
        endMinutes: 10 * 60,
      });
      return;
    }
    const sameDay = toDayKey(arg.start) === toDayKey(new Date(arg.end.getTime() - 1));
    handlers.onCreate({
      allDay: false,
      startDay: toDayKey(arg.start),
      endDay: toDayKey(arg.start),
      startMinutes: minutesOfDay(arg.start),
      endMinutes: sameDay ? minutesOfDay(arg.end) || 24 * 60 : 24 * 60,
    });
  };

  const dateClick = (arg: DateClickArg) => {
    const day = toDayKey(arg.date);
    if (arg.allDay) {
      handlers.onCreate({ allDay: arg.view.type !== "dayGridMonth", startDay: day, endDay: day, startMinutes: 9 * 60, endMinutes: 10 * 60 });
      return;
    }
    const start = minutesOfDay(arg.date);
    handlers.onCreate({ allDay: false, startDay: day, endDay: day, startMinutes: start, endMinutes: Math.min(24 * 60, start + 60) });
  };

  const eventClick = (arg: EventClickArg) => {
    const item = arg.event.extendedProps.item as Item | undefined;
    if (!item) return;
    if (item.kind === "event") handlers.onOpenEvent(item.occurrence);
    else handlers.onOpenTask(item.todo);
  };

  /** Moves and resizes go through the page; a failed save puts the event back. */
  const change = (arg: EventDropArg | EventResizeDoneArg) => {
    const item = arg.event.extendedProps.item as Item | undefined;
    const start = arg.event.start;
    if (!item || !start) return;
    let saving: Promise<unknown>;
    if (item.kind === "task") {
      saving = handlers.onScheduleTask(item.todo._id, toDayKey(start), arg.event.allDay ? null : minutesOfDay(start));
    } else if (item.spanningTimed) {
      // Shown as a bar: shift the real times by the days it was moved.
      const delta = "delta" in arg ? arg.delta.days * 86_400_000 : 0;
      saving = handlers.onChangeEvent(item.occurrence, {
        allDay: false,
        start: new Date(new Date(item.occurrence.start).getTime() + delta),
        end: new Date(new Date(item.occurrence.end).getTime() + delta),
      });
    } else if (arg.event.allDay) {
      const end = arg.event.end ?? new Date(start.getTime() + 86_400_000);
      saving = handlers.onChangeEvent(item.occurrence, {
        allDay: true,
        startDay: toDayKey(start),
        endDay: toDayKey(new Date(end.getTime() - 1)),
      });
    } else {
      saving = handlers.onChangeEvent(item.occurrence, {
        allDay: false,
        start,
        end: arg.event.end ?? new Date(start.getTime() + 60 * 60_000),
      });
    }
    saving.catch(() => arg.revert());
  };

  const drop = (arg: DropArg) => {
    const id = arg.draggedEl.dataset.taskId;
    if (!id) return;
    void handlers.onScheduleTask(id, toDayKey(arg.date), arg.allDay ? null : minutesOfDay(arg.date)).catch(() => undefined);
  };

  return (
    <div className="px-calendar h-[calc(100dvh-14rem)] min-h-[30rem] overflow-hidden rounded-2xl border border-border bg-card/40">
      <FullCalendar
        ref={ref}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={FC_VIEWS[view]}
        initialDate={cursor}
        headerToolbar={false}
        height="100%"
        firstDay={1}
        nowIndicator
        editable
        droppable
        selectable
        selectMirror
        selectMinDistance={5}
        eventLongPressDelay={300}
        selectLongPressDelay={400}
        snapDuration="00:15:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        slotLabelFormat={TIME_FORMAT}
        eventTimeFormat={TIME_FORMAT}
        scrollTime={scrollTimeFor(view, cursor)}
        allDayText=""
        dayMaxEvents
        navLinks
        navLinkDayClick={(date) => handlers.onOpenDay(toDayKey(date))}
        fixedWeekCount
        dayHeaderContent={(arg) => <DayHeader arg={arg} />}
        events={inputs}
        eventContent={(arg) => <EventContent arg={arg} onToggleTask={handlers.onToggleTask} />}
        select={select}
        dateClick={dateClick}
        eventClick={eventClick}
        eventDragStart={() => haptic("hold")}
        eventResizeStart={() => haptic("hold")}
        eventDrop={(arg) => {
          haptic("drop");
          change(arg);
        }}
        eventResize={(arg) => {
          haptic("drop");
          change(arg);
        }}
        drop={(arg) => {
          haptic("drop");
          drop(arg);
        }}
      />
    </div>
  );
}
