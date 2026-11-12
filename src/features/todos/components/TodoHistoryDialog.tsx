import { useMemo } from "react";
import { Flame, Trophy, CheckCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { cn } from "@lib/utils";
import { useTodoHistory } from "../hooks/useTodos";
import type { RecurrenceType, Todo } from "../types/todo-types";

/** 26 weeks: fits a phone screen and covers half a year. */
const WEEKS = 26;
const DAYS = WEEKS * 7;

const CYCLE_UNIT: Record<RecurrenceType, string> = {
  none: "day",
  daily: "day",
  weekly: "week",
  monthly: "month",
};

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

/** `YYYY-MM-DD` in the browser's zone — the same zone the API keyed days by. */
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

interface Cell {
  key: string;
  date: Date;
  future: boolean;
}

/** Monday-first week columns ending with the current week. */
const buildWeeks = (today: Date): Cell[][] => {
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - mondayOffset - (WEEKS - 1) * 7);

  return Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      return { key: dayKey(date), date, future: date > today };
    }),
  );
};

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

interface TodoHistoryDialogProps {
  todo: Todo | null;
  onClose: () => void;
}

/** Streaks and a GitHub-style completion calendar for one recurring task. */
function TodoHistoryDialog({ todo, onClose }: TodoHistoryDialogProps) {
  // The grid starts on a Monday, up to 6 days before the 26-week mark.
  const { history, loading } = useTodoHistory(todo?._id ?? null, DAYS + 7);

  const weeks = useMemo(() => buildWeeks(new Date()), []);
  const counts = useMemo(
    () => new Map(history?.days.map((day) => [day.date, day.count]) ?? []),
    [history],
  );

  const unit = CYCLE_UNIT[todo?.recurrenceType ?? "daily"];
  const doneInWindow = weeks
    .flat()
    .reduce((sum, cell) => sum + (counts.get(cell.key) ?? 0), 0);

  const stats = [
    { icon: Flame, label: "Current streak", value: history ? plural(history.streak.current, unit) : "–" },
    { icon: Trophy, label: "Best streak", value: history ? plural(history.streak.best, unit) : "–" },
    { icon: CheckCheck, label: "All-time", value: history ? `${history.total} done` : "–" },
  ];

  return (
    <Dialog open={todo !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6">{todo?.text}</DialogTitle>
          <DialogDescription>
            {loading
              ? "Loading history…"
              : `${plural(doneInWindow, "completion")} in the last ${WEEKS} weeks`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="inline-flex gap-[3px]">
            <div className="mr-1 flex flex-col gap-[3px] pt-4 text-[9px] leading-[12px] text-muted-foreground">
              {WEEKDAY_LABELS.map((label, index) => (
                <span key={index} className="h-3">
                  {label}
                </span>
              ))}
            </div>
            {weeks.map((week, index) => {
              const first = week[0] as Cell;
              const previous = weeks[index - 1]?.[0];
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
                              })}: ${count ? plural(count, "completion") : "nothing"}`
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
      </DialogContent>
    </Dialog>
  );
}

export default TodoHistoryDialog;
