import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Flag, Repeat } from "lucide-react";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import type { Todo } from "@features/todos/types/todo-types";
import { atMinutes, formatTime, hhmm, minutesOfDay, parseDay } from "../calendar-dates";
import {
  HOUR_PX,
  TASK_MIME,
  colorOf,
  dayItemsOn,
  layoutLanes,
  timedItemsOn,
  todayKey,
  type DayItem,
  type TimedItem,
} from "../calendar-items";
import type { CalendarOccurrence } from "../types/calendar-types";
import type { EventDraft } from "./EventDialog";

const SNAP = 15;

export interface GridHandlers {
  onCreate: (draft: EventDraft) => void;
  onOpenEvent: (occurrence: CalendarOccurrence) => void;
  onOpenTask: (todo: Todo) => void;
  onToggleTask: (todo: Todo) => void;
  /** Moves or resizes an event occurrence to `day`, from `start` to `end` minutes. */
  onMoveEvent: (occurrence: CalendarOccurrence, day: string, start: number, end: number) => void;
  /** Schedules a task on `day`, at `minutes` past midnight, or all day when null. */
  onScheduleTask: (todoId: string, day: string, minutes: number | null) => void;
}

type Drag =
  | { mode: "create"; day: string; anchor: number; start: number; end: number; moved: boolean }
  | {
      mode: "move" | "resize";
      item: TimedItem;
      grabOffset: number;
      originX: number;
      originY: number;
      day: string;
      start: number;
      end: number;
      moved: boolean;
    };

const snap = (minutes: number) => Math.max(0, Math.min(24 * 60, Math.round(minutes / SNAP) * SNAP));

function AllDayChip({ item, handlers }: { item: DayItem; handlers: GridHandlers }) {
  if (item.kind === "event") {
    const color = colorOf(item.occurrence);
    return (
      <button
        type="button"
        draggable={false}
        onClick={() => handlers.onOpenEvent(item.occurrence)}
        className="block w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs text-foreground"
        style={{ background: `color-mix(in srgb, ${color} 28%, transparent)`, boxShadow: `inset 3px 0 0 ${color}` }}
      >
        {item.continues ? "↳ " : ""}
        {item.occurrence.title || "Untitled"}
      </button>
    );
  }
  return (
    <div
      draggable
      onDragStart={(event) => event.dataTransfer.setData(TASK_MIME, item.todo._id)}
      onClick={() => handlers.onOpenTask(item.todo)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-1 truncate rounded-md border border-dashed px-1.5 py-0.5 text-xs",
        item.deadline ? "border-destructive/50 text-destructive" : "border-border text-soft",
        item.todo.completed && "line-through opacity-60",
      )}
    >
      {item.deadline ? (
        <Flag className="h-3 w-3 shrink-0" />
      ) : (
        <button
          type="button"
          aria-label={item.todo.completed ? "Reopen" : "Complete"}
          onClick={(event) => {
            event.stopPropagation();
            handlers.onToggleTask(item.todo);
          }}
          className={cn(
            "flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border",
            item.todo.completed ? "border-rating bg-rating text-rating-foreground" : "border-muted-foreground",
          )}
        >
          {item.todo.completed && <Check className="h-2 w-2" strokeWidth={4} />}
        </button>
      )}
      <span className="truncate">{item.todo.text}</span>
    </div>
  );
}

/** An hour grid for one or more days (week and day views), with an all-day row on top. */
export default function TimeGrid({
  days,
  events,
  todos,
  handlers,
}: {
  days: string[];
  events: CalendarOccurrence[];
  todos: Todo[];
  handlers: GridHandlers;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: string; minutes: number | null } | null>(null);
  const now = useNow(true, 60_000);
  const today = todayKey();

  // Open around the morning, or an hour before now when today is shown.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const nowMinutes = minutesOfDay(new Date());
    const target = days.includes(todayKey()) ? Math.max(0, nowMinutes - 90) : 7 * 60;
    scroller.scrollTop = (target / 60) * HOUR_PX;
    // Only when the range changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.join()]);

  const pointAt = (clientX: number, clientY: number) => {
    const rect = columnsRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const width = rect.width / days.length;
    const index = Math.max(0, Math.min(days.length - 1, Math.floor((clientX - rect.left) / width)));
    const minutes = ((clientY - rect.top) / HOUR_PX) * 60;
    return { day: days[index] as string, minutes };
  };

  const startCreate = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    const point = pointAt(event.clientX, event.clientY);
    if (!point) return;
    const anchor = Math.floor(point.minutes / 30) * 30;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ mode: "create", day: point.day, anchor, start: anchor, end: anchor + 60, moved: false });
  };

  const startItem = (event: ReactPointerEvent, item: TimedItem, mode: "move" | "resize") => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const point = pointAt(event.clientX, event.clientY);
    if (!point) return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    setDrag({
      mode,
      item,
      grabOffset: point.minutes - item.start,
      originX: event.clientX,
      originY: event.clientY,
      day: item.day,
      start: item.start,
      end: item.end,
      moved: false,
    });
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    if (!drag) return;
    const point = pointAt(event.clientX, event.clientY);
    if (!point) return;
    if (drag.mode === "create") {
      const at = snap(point.minutes);
      const start = Math.min(drag.anchor, at);
      const end = Math.max(drag.anchor + SNAP, at);
      setDrag({ ...drag, start, end, moved: drag.moved || Math.abs(at - drag.anchor) >= SNAP });
      return;
    }
    const moved = drag.moved || Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY) > 4;
    if (drag.mode === "move") {
      const length = drag.item.end - drag.item.start;
      const start = Math.min(24 * 60 - length, snap(point.minutes - drag.grabOffset));
      setDrag({ ...drag, day: point.day, start, end: start + length, moved });
    } else {
      setDrag({ ...drag, end: Math.max(drag.start + SNAP, snap(point.minutes)), moved });
    }
  };

  const onPointerUp = () => {
    if (!drag) return;
    const current = drag;
    setDrag(null);
    if (current.mode === "create") {
      handlers.onCreate({
        allDay: false,
        startDay: current.day,
        endDay: current.day,
        startMinutes: current.start,
        endMinutes: current.moved ? current.end : Math.min(24 * 60, current.start + 60),
      });
      return;
    }
    const { item } = current;
    if (!current.moved) {
      if (item.kind === "event") handlers.onOpenEvent(item.occurrence);
      else handlers.onOpenTask(item.todo);
      return;
    }
    if (item.kind === "event") handlers.onMoveEvent(item.occurrence, current.day, current.start, current.end);
    else handlers.onScheduleTask(item.todo._id, current.day, current.start);
  };

  const dropProps = (day: string, allDay: boolean) => ({
    onDragOver: (event: React.DragEvent) => {
      if (!event.dataTransfer.types.includes(TASK_MIME)) return;
      event.preventDefault();
      const point = allDay ? null : pointAt(event.clientX, event.clientY);
      setDropTarget({ day, minutes: point ? Math.floor(point.minutes / SNAP) * SNAP : null });
    },
    onDragLeave: () => setDropTarget(null),
    onDrop: (event: React.DragEvent) => {
      const id = event.dataTransfer.getData(TASK_MIME);
      setDropTarget(null);
      if (!id) return;
      event.preventDefault();
      const point = allDay ? null : pointAt(event.clientX, event.clientY);
      handlers.onScheduleTask(id, day, point ? Math.floor(point.minutes / SNAP) * SNAP : null);
    },
  });

  const block = (item: TimedItem, lane: number, lanes: number, ghost = false) => {
    const top = (item.start / 60) * HOUR_PX;
    const height = Math.max(18, ((item.end - item.start) / 60) * HOUR_PX - 2);
    const style = {
      top,
      height,
      left: `calc(${(lane / lanes) * 100}% + 2px)`,
      width: `calc(${100 / lanes}% - 4px)`,
    };
    if (item.kind === "task") {
      return (
        <div
          key={ghost ? "ghost" : item.key}
          onPointerDown={(event) => startItem(event, item, "move")}
          className={cn(
            "absolute z-10 flex cursor-grab items-start gap-1.5 overflow-hidden rounded-md border border-dashed border-rating/60 bg-card px-1.5 py-0.5 text-xs text-soft touch-none",
            ghost && "pointer-events-none opacity-70 shadow-lg",
            item.todo.completed && "opacity-60",
          )}
          style={style}
        >
          <button
            type="button"
            aria-label={item.todo.completed ? "Reopen" : "Complete"}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => handlers.onToggleTask(item.todo)}
            className={cn(
              "mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border",
              item.todo.completed ? "border-rating bg-rating text-rating-foreground" : "border-muted-foreground",
            )}
          >
            {item.todo.completed && <Check className="h-2 w-2" strokeWidth={4} />}
          </button>
          <span className={cn("truncate", item.todo.completed && "line-through")}>
            {hhmm(item.start)} {item.todo.text}
          </span>
        </div>
      );
    }
    const color = colorOf(item.occurrence);
    const short = item.end - item.start <= 45;
    return (
      <div
        key={ghost ? "ghost" : item.key}
        onPointerDown={(event) => startItem(event, item, "move")}
        className={cn(
          "absolute z-10 cursor-grab overflow-hidden rounded-md px-1.5 py-0.5 text-xs text-foreground touch-none",
          ghost && "pointer-events-none opacity-80 shadow-xl",
        )}
        style={{
          ...style,
          background: `color-mix(in srgb, ${color} 26%, var(--card))`,
          boxShadow: `inset 3px 0 0 ${color}`,
        }}
      >
        <span className={cn("flex items-center gap-1", short ? "truncate" : "")}>
          <span className="truncate font-medium">{item.occurrence.title || "Untitled"}</span>
          {item.occurrence.repeat && <Repeat className="h-2.5 w-2.5 shrink-0 opacity-70" />}
          {short && <span className="shrink-0 text-muted-foreground">{hhmm(item.start)}</span>}
        </span>
        {!short && (
          <span className="block truncate text-muted-foreground">
            {formatTime(atMinutes(item.day, item.start))} - {formatTime(atMinutes(item.day, item.end))}
            {item.occurrence.location ? ` · ${item.occurrence.location}` : ""}
          </span>
        )}
        <span
          aria-hidden
          onPointerDown={(event) => startItem(event, item, "resize")}
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
        />
      </div>
    );
  };

  const dragging = drag && drag.mode !== "create" && drag.moved ? drag : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
      {/* Day headers and the all-day row */}
      <div className="flex border-b border-border">
        <div className="w-12 shrink-0 sm:w-14" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day) => {
            const date = parseDay(day);
            const items = dayItemsOn(day, events, todos);
            const isToday = day === today;
            return (
              <div
                key={day}
                {...dropProps(day, true)}
                className={cn(
                  "min-h-[3.25rem] space-y-0.5 border-l border-border px-1 pb-1.5 pt-1 first:border-l-0",
                  dropTarget?.day === day && dropTarget.minutes === null && "bg-rating/10",
                )}
              >
                <div className="flex items-baseline gap-1.5 px-0.5 pb-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {date.toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm tabular-nums",
                      isToday ? "bg-rating font-semibold text-rating-foreground" : "text-foreground",
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>
                {items.map((item) => (
                  <AllDayChip key={item.key} item={item} handlers={handlers} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hours */}
      <div ref={scrollRef} className="relative max-h-[calc(100dvh-17rem)] min-h-[24rem] overflow-y-auto">
        <div className="flex" style={{ height: 24 * HOUR_PX }}>
          <div className="relative w-12 shrink-0 sm:w-14">
            {Array.from({ length: 23 }, (_, index) => (
              <span
                key={index}
                className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                style={{ top: (index + 1) * HOUR_PX }}
              >
                {hhmm((index + 1) * 60)}
              </span>
            ))}
          </div>
          <div
            ref={columnsRef}
            className="relative grid flex-1 select-none"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
          >
            {/* Hour lines */}
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 24 }, (_, index) => (
                <div key={index} className="border-t border-border/60" style={{ height: HOUR_PX }} />
              ))}
            </div>
            {days.map((day) => {
              const placed = layoutLanes(timedItemsOn(day, events, todos));
              const isToday = day === today;
              return (
                <div
                  key={day}
                  onPointerDown={startCreate}
                  {...dropProps(day, false)}
                  className="relative border-l border-border/70 first:border-l-0"
                >
                  {placed.map(({ item, lane, lanes }) =>
                    dragging && dragging.item.key === item.key ? null : block(item, lane, lanes),
                  )}
                  {drag?.mode === "create" && drag.day === day && (
                    <div
                      className="pointer-events-none absolute inset-x-1 z-20 rounded-md border border-rating/70 bg-rating/20 px-1.5 text-xs text-foreground"
                      style={{ top: (drag.start / 60) * HOUR_PX, height: ((drag.end - drag.start) / 60) * HOUR_PX }}
                    >
                      {hhmm(drag.start)} - {hhmm(drag.end)}
                    </div>
                  )}
                  {dragging && dragging.day === day &&
                    block({ ...dragging.item, day, start: dragging.start, end: dragging.end } as TimedItem, 0, 1, true)}
                  {dropTarget?.day === day && dropTarget.minutes !== null && (
                    <div
                      className="pointer-events-none absolute inset-x-1 z-20 h-6 rounded-md border border-dashed border-rating bg-rating/10 px-1.5 text-xs text-rating"
                      style={{ top: (dropTarget.minutes / 60) * HOUR_PX }}
                    >
                      {hhmm(dropTarget.minutes)}
                    </div>
                  )}
                  {isToday && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-30 h-px bg-destructive"
                      style={{ top: (minutesOfDay(new Date(now)) / 60) * HOUR_PX }}
                    >
                      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
