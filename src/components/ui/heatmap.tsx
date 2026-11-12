import { useMemo } from "react";
import { cn } from "@lib/utils";

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

/** `YYYY-MM-DD` in the browser's zone — the same zone the API keys days by. */
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

/**
 * Days of history to request for a `weeks`-wide grid: the grid starts on a
 * Monday, up to 6 days before the week mark.
 */
export const heatmapDays = (weeks: number) => weeks * 7 + 7;

interface Cell {
  key: string;
  date: Date;
  future: boolean;
}

/** Monday-first week columns ending with the current week. */
const buildWeeks = (today: Date, weeks: number): Cell[][] => {
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - mondayOffset - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      return { key: dayKey(date), date, future: date > today };
    }),
  );
};

interface HeatmapProps {
  /** Counts per `YYYY-MM-DD`; missing days are zero. */
  days: Array<{ date: string; count: number }> | undefined;
  /** Columns; 26 fits a phone screen and covers half a year. */
  weeks?: number;
  loading?: boolean;
  /** Tooltip text for a past day's count, e.g. "2 workouts". */
  describe: (count: number) => string;
  className?: string;
}

/** GitHub-style calendar of activity per day. */
export function Heatmap({ days, weeks = 26, loading, describe, className }: HeatmapProps) {
  const grid = useMemo(() => buildWeeks(new Date(), weeks), [weeks]);
  const counts = useMemo(
    () => new Map(days?.map((day) => [day.date, day.count]) ?? []),
    [days],
  );

  return (
    <div className={cn("overflow-x-auto pb-1", className)}>
      <div className="inline-flex gap-[3px]">
        <div className="mr-1 flex flex-col gap-[3px] pt-4 text-[9px] leading-[12px] text-muted-foreground">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="h-3">
              {label}
            </span>
          ))}
        </div>
        {grid.map((week, index) => {
          const first = week[0] as Cell;
          const previous = grid[index - 1]?.[0];
          const newMonth = !previous || previous.date.getMonth() !== first.date.getMonth();
          return (
            <div key={first.key} className="flex flex-col gap-[3px]">
              <span className="h-[13px] whitespace-nowrap text-[9px] text-muted-foreground">
                {newMonth ? first.date.toLocaleDateString(undefined, { month: "short" }) : ""}
              </span>
              {week.map((cell) => {
                const count = counts.get(cell.key) ?? 0;
                return (
                  <div
                    key={cell.key}
                    title={
                      cell.future
                        ? undefined
                        : `${cell.date.toLocaleDateString(undefined, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}: ${describe(count)}`
                    }
                    className={cn(
                      "h-3 w-3 rounded-[3px]",
                      cell.future
                        ? "bg-transparent"
                        : count === 0
                          ? "bg-secondary"
                          : count === 1
                            ? "bg-rating/70"
                            : "bg-rating",
                      loading && !cell.future && "animate-pulse",
                    )}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
