import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@lib/utils";
import { toDayKey } from "../../due";

const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** A month grid, Monday first. Past days are dimmed but pickable (for deadlines already missed). */
export default function MiniCalendar({
  value,
  onPick,
}: {
  value?: string | null;
  onPick: (day: string) => void;
}) {
  const today = toDayKey(new Date());
  const initial = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00`) : new Date();
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));

  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<string | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      toDayKey(new Date(month.getFullYear(), month.getMonth(), index + 1)),
    ),
  ];

  const shift = (months: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + months, 1));

  return (
    <div className="select-none">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-sm text-foreground">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <span className="flex">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shift(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </span>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        {WEEK.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, index) =>
          day ? (
            <button
              key={day}
              type="button"
              onClick={() => onPick(day)}
              className={cn(
                "flex h-8 items-center justify-center rounded-lg text-[13px] tabular-nums transition-colors",
                day === value
                  ? "bg-rating font-semibold text-rating-foreground"
                  : day === today
                    ? "text-rating hover:bg-secondary"
                    : day < today
                      ? "text-muted-foreground/60 hover:bg-secondary"
                      : "text-soft hover:bg-secondary hover:text-foreground",
              )}
            >
              {Number(day.slice(8))}
            </button>
          ) : (
            <span key={`blank-${index}`} />
          ),
        )}
      </div>
    </div>
  );
}
