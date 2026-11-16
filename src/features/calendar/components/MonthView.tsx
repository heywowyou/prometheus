import { useState } from "react";
import { Flag } from "lucide-react";
import { cn } from "@lib/utils";
import type { Todo } from "@features/todos/types/todo-types";
import { hhmm, monthGrid, parseDay } from "../calendar-dates";
import { TASK_MIME, colorOf, monthItemsOn, spanBars, todayKey } from "../calendar-items";
import type { CalendarOccurrence } from "../types/calendar-types";
import type { GridHandlers } from "./TimeGrid";
import SpanBarItem, { EVENT_MIME } from "./SpanBarItem";

const MAX_ITEMS = 3;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Six weeks; drag events and tasks between days, click a day to add an event. */
export default function MonthView({
  cursor,
  events,
  todos,
  handlers,
  onOpenDay,
}: {
  cursor: string;
  events: CalendarOccurrence[];
  todos: Todo[];
  handlers: GridHandlers;
  onOpenDay: (day: string) => void;
}) {
  const days = monthGrid(cursor);
  const month = cursor.slice(0, 7);
  const today = todayKey();
  const [over, setOver] = useState<string | null>(null);
  const byId = new Map(events.map((occurrence) => [occurrence._id, occurrence]));

  const drop = (day: string, event: React.DragEvent) => {
    setOver(null);
    const taskId = event.dataTransfer.getData(TASK_MIME);
    const occurrenceId = event.dataTransfer.getData(EVENT_MIME);
    if (taskId) {
      event.preventDefault();
      const todo = todos.find((item) => item._id === taskId);
      handlers.onScheduleTask(taskId, day, todo?.time ? Number(todo.time.slice(0, 2)) * 60 + Number(todo.time.slice(3)) : null);
    } else if (occurrenceId) {
      event.preventDefault();
      const occurrence = byId.get(occurrenceId);
      if (!occurrence) return;
      const start = new Date(occurrence.start);
      const end = new Date(occurrence.end);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const lengthMinutes = Math.round((end.getTime() - start.getTime()) / 60_000);
      handlers.onMoveEvent(occurrence, day, startMinutes, startMinutes + lengthMinutes);
    }
  };

  const weeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7));

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-card/60">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            {weekday}
          </span>
        ))}
      </div>
      {weeks.map((week, weekIndex) => {
        const spans = spanBars(week, events);
        // Bars take the first lanes; cells fill what's left of their item budget.
        const shownLanes = Math.min(spans.lanes, MAX_ITEMS);
        const hiddenBars = (col: number) =>
          spans.bars.filter((bar) => bar.lane >= shownLanes && bar.startCol <= col && bar.endCol >= col).length;
        return (
          <div
            key={week[0]}
            className={cn("relative grid grid-cols-7", weekIndex > 0 && "border-t border-border")}
            style={{ gridTemplateRows: `auto ${shownLanes > 0 ? `repeat(${shownLanes}, auto)` : ""} 1fr` }}
          >
            {/* Day cells: background, borders, click to add, drop target. */}
            {week.map((day, col) => {
              const inMonth = day.startsWith(month);
              return (
                <div
                  key={`bg-${day}`}
                  onClick={(event) => {
                    if (event.target !== event.currentTarget) return;
                    handlers.onCreate({ allDay: false, startDay: day, endDay: day, startMinutes: 9 * 60, endMinutes: 10 * 60 });
                  }}
                  onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes(TASK_MIME) && !event.dataTransfer.types.includes(EVENT_MIME)) return;
                    event.preventDefault();
                    setOver(day);
                  }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(event) => drop(day, event)}
                  className={cn(
                    "min-h-[6.5rem] border-border sm:min-h-[7.5rem]",
                    col > 0 && "border-l",
                    !inMonth && "bg-background/60",
                    over === day && "bg-rating/10",
                  )}
                  style={{ gridColumn: col + 1, gridRow: "1 / -1" }}
                />
              );
            })}
            {week.map((day, col) => {
              const inMonth = day.startsWith(month);
              return (
                <div key={`num-${day}`} className="pointer-events-none p-1 pb-0.5" style={{ gridColumn: col + 1, gridRow: 1 }}>
                  <button
                    type="button"
                    onClick={() => onOpenDay(day)}
                    className={cn(
                      "pointer-events-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums hover:bg-secondary",
                      day === today
                        ? "bg-rating font-semibold text-rating-foreground hover:bg-rating"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/60",
                    )}
                  >
                    {parseDay(day).getDate()}
                  </button>
                </div>
              );
            })}
            {shownLanes > 0 && (
              <div
                className="pointer-events-none grid gap-y-0.5 pb-0.5"
                style={{
                  gridColumn: "1 / -1",
                  gridRow: `2 / span ${shownLanes}`,
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gridTemplateRows: `repeat(${shownLanes}, auto)`,
                }}
              >
                {spans.bars
                  .filter((bar) => bar.lane < shownLanes)
                  .map((bar) => (
                    <span key={bar.key} className="pointer-events-auto contents">
                      <SpanBarItem bar={bar} onOpen={handlers.onOpenEvent} draggable dense />
                    </span>
                  ))}
              </div>
            )}
            {week.map((day, col) => {
              const items = monthItemsOn(day, events, todos);
              const lanesHere = spans.bars.filter((bar) => bar.lane < shownLanes && bar.startCol <= col && bar.endCol >= col).length;
              const budget = Math.max(1, MAX_ITEMS - lanesHere);
              const hidden = Math.max(0, items.length - budget) + hiddenBars(col);
              return (
                <div
                  key={`items-${day}`}
                  className="pointer-events-none min-w-0 space-y-0.5 px-1 pb-1"
                  style={{ gridColumn: col + 1, gridRow: shownLanes + 2 }}
                >
                  {items.slice(0, budget).map((item) => {
                    if (item.kind === "event") {
                      const timed = item as { occurrence: CalendarOccurrence; start: number; key: string };
                      return (
                        <button
                          key={timed.key}
                          type="button"
                          draggable
                          onDragStart={(event) => event.dataTransfer.setData(EVENT_MIME, timed.occurrence._id)}
                          onClick={() => handlers.onOpenEvent(timed.occurrence)}
                          className="pointer-events-auto flex w-full items-center gap-1 truncate rounded px-1 py-px text-left text-[11px] text-soft hover:bg-secondary"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colorOf(timed.occurrence) }} />
                          <span className="hidden tabular-nums text-muted-foreground sm:inline">{hhmm(timed.start)}</span>
                          <span className="truncate">{timed.occurrence.title || "Untitled"}</span>
                        </button>
                      );
                    }
                    const deadline = "deadline" in item && item.deadline;
                    const overdue = deadline && !item.todo.completed && day < today;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData(TASK_MIME, item.todo._id)}
                        onClick={() => handlers.onOpenTask(item.todo)}
                        className={cn(
                          "pointer-events-auto flex w-full items-center gap-1 truncate rounded border border-dashed px-1 py-px text-left text-[11px]",
                          overdue ? "border-destructive/50 text-destructive" : "border-border text-soft",
                          item.todo.completed && "line-through opacity-60",
                        )}
                      >
                        {deadline && <Flag className="h-2.5 w-2.5 shrink-0" />}
                        <span className="truncate">{item.todo.text}</span>
                      </button>
                    );
                  })}
                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenDay(day)}
                      className="pointer-events-auto px-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      {hidden} more
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
