import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@lib/utils";
import { colorOf, type SpanBar } from "../calendar-items";
import { formatTime } from "../calendar-dates";
import type { CalendarOccurrence } from "../types/calendar-types";

export const EVENT_MIME = "application/x-prometheus-event";

/**
 * An all-day or multi-day event as one continuous bar: the title once, at its
 * start, and the event's color behind every day it covers. Square ends mark
 * an event that goes on past the days shown.
 */
export default function SpanBarItem({
  bar,
  onOpen,
  draggable = false,
  dense = false,
}: {
  bar: SpanBar;
  onOpen: (occurrence: CalendarOccurrence) => void;
  draggable?: boolean;
  dense?: boolean;
}) {
  const { occurrence } = bar;
  const color = colorOf(occurrence);
  const startsHere = !bar.continuesBefore;
  const time = !occurrence.allDay && startsHere ? formatTime(new Date(occurrence.start)) : null;
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={draggable ? (event) => event.dataTransfer.setData(EVENT_MIME, occurrence._id) : undefined}
      onClick={() => onOpen(occurrence)}
      title={occurrence.title || "Untitled"}
      className={cn(
        "relative z-10 flex min-w-0 items-center gap-1 overflow-hidden text-left text-foreground transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dense ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        startsHere ? "ml-1 rounded-l-md" : "",
        bar.continuesAfter ? "" : "mr-1 rounded-r-md",
      )}
      style={{
        gridColumn: `${bar.startCol + 1} / ${bar.endCol + 2}`,
        gridRow: bar.lane + 1,
        background: `color-mix(in srgb, ${color} 30%, var(--card))`,
        boxShadow: startsHere ? `inset 3px 0 0 ${color}` : undefined,
      }}
    >
      {bar.continuesBefore && <ChevronLeft className="h-3 w-3 shrink-0 text-soft" aria-label="Started earlier" />}
      {time && <span className="shrink-0 tabular-nums text-soft">{time}</span>}
      <span className="truncate font-medium">{occurrence.title || "Untitled"}</span>
      {bar.continuesAfter && <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-soft" aria-label="Continues" />}
    </button>
  );
}
