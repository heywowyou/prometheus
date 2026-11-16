import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@components/ui/button";
import { useMediaQuery } from "@lib/hooks/useMediaQuery";
import { cn } from "@lib/utils";
import { useTaskData } from "@features/todos/hooks/useTaskData";
import { useRowContext } from "@features/todos/hooks/useTaskActions";
import { isDay } from "@features/todos/task-views";
import { addDaysKey, addMonthsKey, atMinutes, hhmm, monthGrid, parseDay, weekDays } from "../calendar-dates";
import { calendarTasks, todayKey } from "../calendar-items";
import { useEventActions, useEvents } from "../hooks/useCalendar";
import type { CalendarOccurrence, CalendarView, EventPayload } from "../types/calendar-types";
import EventDialog, { type EventDraft } from "../components/EventDialog";
import MonthView from "../components/MonthView";
import TaskDialog from "../components/TaskDialog";
import TaskTray from "../components/TaskTray";
import TimeGrid, { type GridHandlers } from "../components/TimeGrid";

const VIEWS: Array<{ value: CalendarView; label: string; key: string }> = [
  { value: "month", label: "Month", key: "m" },
  { value: "week", label: "Week", key: "w" },
  { value: "day", label: "Day", key: "d" },
];

const isView = (value: string | null): value is CalendarView =>
  value === "month" || value === "week" || value === "day";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** The calendar: Prometheus events plus tasks on their days, in month, week and day views. */
export default function CalendarPage() {
  const phone = useMediaQuery("(max-width: 767px)");
  const [params, setParams] = useSearchParams();
  const view: CalendarView = isView(params.get("view")) ? (params.get("view") as CalendarView) : phone ? "day" : "week";
  const dateParam = params.get("date");
  const cursor = dateParam && isDay(dateParam) ? dateParam : todayKey();

  const go = (next: { view?: CalendarView; date?: string }) => {
    const search = new URLSearchParams(params);
    if (next.view) search.set("view", next.view);
    if (next.date) search.set("date", next.date);
    setParams(search, { replace: true });
  };

  const days = view === "month" ? monthGrid(cursor) : view === "week" ? weekDays(cursor) : [cursor];
  const from = days[0] as string;
  const to = days[days.length - 1] as string;
  const { events } = useEvents(from, to);
  const eventActions = useEventActions();
  const data = useTaskData();
  const context = useRowContext(data, { showList: true });

  const [draft, setDraft] = useState<EventDraft | null>(null);
  // `?new=<title>` (an event typed in search) opens the new-event dialog once.
  const newTitle = params.get("new");
  const [handledNew, setHandledNew] = useState<string | null>(null);
  const [openOccurrence, setOpenOccurrence] = useState<CalendarOccurrence | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = openTaskId ? (data.todos.find((todo) => todo._id === openTaskId) ?? null) : null;

  const tasks = useMemo(() => calendarTasks(data.todos), [data.todos]);
  const unscheduled = useMemo(
    () =>
      [...data.index.inbox, ...data.index.anytime].filter(
        (todo, index, all) => !todo.completed && !isDay(todo.when) && all.findIndex((item) => item._id === todo._id) === index,
      ),
    [data.index],
  );

  const step = (direction: 1 | -1) =>
    go({
      date:
        view === "month"
          ? addMonthsKey(cursor, direction)
          : addDaysKey(cursor, direction * (view === "week" ? 7 : 1)),
    });

  // t: today, m/w/d: views, arrows: previous and next.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      const view = VIEWS.find((item) => item.key === event.key);
      if (view) go({ view: view.value });
      else if (event.key === "t") go({ date: todayKey() });
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handlers: GridHandlers = {
    onCreate: setDraft,
    onOpenEvent: setOpenOccurrence,
    onOpenTask: (todo) => setOpenTaskId(todo._id),
    onToggleTask: (todo) => data.toggleTodo(todo._id),
    onMoveEvent: (occurrence, day, start, end) => {
      if (occurrence.allDay) {
        const span = Math.round(
          (parseDay(occurrence.endDay as string).getTime() - parseDay(occurrence.startDay as string).getTime()) / 86_400_000,
        );
        void eventActions.updateEvent(occurrence, { startDay: day, endDay: addDaysKey(day, span) });
        return;
      }
      void eventActions.updateEvent(occurrence, {
        start: atMinutes(day, start).toISOString(),
        end: atMinutes(day, end).toISOString(),
      });
    },
    onScheduleTask: (todoId, day, minutes) => {
      void data
        .updateTodo(todoId, { when: day, evening: false, time: minutes === null ? null : hhmm(minutes) })
        .catch(() => undefined);
    },
  };

  const saveEvent = (payload: EventPayload) =>
    openOccurrence ? eventActions.updateEvent(openOccurrence, payload) : eventActions.createEvent(payload);

  const title =
    view === "day"
      ? parseDay(cursor).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })
      : parseDay(view === "week" ? (days[3] as string) : cursor).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });

  const now = new Date();
  const newEventDraft = (): EventDraft => {
    const day = view === "month" || cursor === todayKey() ? todayKey() : cursor;
    const startMinutes = day === todayKey() ? Math.min(23 * 60, (now.getHours() + 1) * 60) : 9 * 60;
    return { allDay: false, startDay: day, endDay: day, startMinutes, endMinutes: startMinutes + 60 };
  };

  if (newTitle && newTitle !== handledNew) {
    setHandledNew(newTitle);
    setDraft({ ...newEventDraft(), title: newTitle });
  }

  return (
    <>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center gap-3 pt-1 sm:pt-4">
          <CalendarDays className="hidden h-6 w-6 text-info sm:block" />
          <h1 className="page-title mr-auto text-[2rem] sm:text-[2.5rem]">{title}</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => go({ date: todayKey() })} title="Today (T)">
              Today
            </Button>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => step(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex rounded-full border border-border bg-card p-0.5 text-sm">
            {VIEWS.map((item) => (
              <button
                key={item.value}
                type="button"
                title={`${item.label} (${item.key.toUpperCase()})`}
                onClick={() => go({ view: item.value })}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  view === item.value ? "bg-raised text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* On phones this floats above the tab bar instead of taking a row. */}
          <Button
            size="sm"
            onClick={() => setDraft(newEventDraft())}
            aria-label="New event"
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-30 h-14 w-14 rounded-full p-0 shadow-lg shadow-overlay/50 sm:static sm:h-9 sm:w-auto sm:px-4 sm:shadow-none"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Event</span>
          </Button>
        </header>

        {view === "day" && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {weekDays(cursor).map((day) => {
              const date = parseDay(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => go({ date: day })}
                  className={cn(
                    "flex min-w-[3rem] flex-1 flex-col items-center rounded-xl py-1.5 text-xs transition-colors",
                    day === cursor ? "bg-raised text-foreground" : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <span className="uppercase tracking-wider">{date.toLocaleDateString(undefined, { weekday: "narrow" })}</span>
                  <span className={cn("text-base tabular-nums", day === todayKey() && "text-rating")}>{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            {view === "month" ? (
              <MonthView
                cursor={cursor}
                events={events}
                todos={tasks}
                handlers={handlers}
                onOpenDay={(day) => go({ view: "day", date: day })}
              />
            ) : (
              <TimeGrid days={days} events={events} todos={tasks} handlers={handlers} />
            )}
          </div>
          {!phone && (
            <div className="hidden w-60 shrink-0 xl:block">
              <TaskTray tasks={unscheduled} onOpenTask={(todo) => setOpenTaskId(todo._id)} />
            </div>
          )}
        </div>
      </div>

      <EventDialog
        occurrence={openOccurrence}
        draft={draft}
        onSave={saveEvent}
        onDelete={(onlyThis) => openOccurrence && eventActions.deleteEvent(openOccurrence, onlyThis)}
        onClose={() => {
          setDraft(null);
          setOpenOccurrence(null);
        }}
      />
      <TaskDialog todo={openTask} context={context} onClose={() => setOpenTaskId(null)} />
    </>
  );
}
