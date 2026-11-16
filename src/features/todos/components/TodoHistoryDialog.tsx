import { useMemo } from "react";
import { CalendarDays, CalendarRange, CheckCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Heatmap, dayKey, heatmapDays } from "@components/ui/heatmap";
import { useTodoHistory } from "../hooks/useTodos";
import type { Todo } from "../types/todo-types";

/** 26 weeks: fits a phone screen and covers half a year. */
const WEEKS = 26;

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

/** Sum of counts from the first day shown in the grid onwards. */
const countInWindow = (days: Array<{ date: string; count: number }>) => {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const from = dayKey(start);
  return days.reduce((sum, day) => (day.date >= from ? sum + day.count : sum), 0);
};

interface TodoHistoryDialogProps {
  todo: Todo | null;
  onClose: () => void;
}

/** Days with a completion from `from` (`YYYY-MM-DD`) onwards. */
const daysSince = (days: Array<{ date: string }>, from: string) => days.filter((day) => day.date >= from).length;

/** What a habit has added up to, and its completion calendar. Counts only what was done. */
function TodoHistoryDialog({ todo, onClose }: TodoHistoryDialogProps) {
  const { history, loading } = useTodoHistory(todo?._id ?? null, heatmapDays(WEEKS));

  const doneInWindow = useMemo(() => countInWindow(history?.days ?? []), [history]);
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = [
    { icon: CalendarDays, label: "This week", value: history ? plural(daysSince(history.days, dayKey(monday)), "day") : "-" },
    { icon: CalendarRange, label: "This month", value: history ? plural(daysSince(history.days, dayKey(firstOfMonth)), "day") : "-" },
    { icon: CheckCheck, label: "All time", value: history ? `${history.total} done` : "-" },
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

        <Heatmap
          days={history?.days}
          weeks={WEEKS}
          loading={loading}
          describe={(count) => (count ? plural(count, "completion") : "nothing")}
        />
      </DialogContent>
    </Dialog>
  );
}

export default TodoHistoryDialog;
