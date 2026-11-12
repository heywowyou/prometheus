import { Clock, Dumbbell, ListChecks, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { formatDuration } from "@lib/date/duration";
import { formatVolume } from "../workout-format";
import { PR_LABELS, sessionStats, type FinishResult } from "../types/workout-types";

interface FinishSummaryDialogProps {
  result: FinishResult | null;
  onClose: () => void;
}

/** Shown once a workout is finished: totals and any personal records. */
function FinishSummaryDialog({ result, onClose }: FinishSummaryDialogProps) {
  const session = result?.session;
  const stats = session ? sessionStats(session) : null;
  const durationSec =
    session?.finishedAt
      ? (new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
      : 0;

  const tiles = stats
    ? [
        { icon: Clock, label: "Time", value: formatDuration(durationSec) },
        { icon: ListChecks, label: "Sets", value: String(stats.sets) },
        { icon: Dumbbell, label: "Volume", value: stats.volumeKg ? formatVolume(stats.volumeKg) : "–" },
      ]
    : [];

  return (
    <Dialog open={result !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workout done 💪</DialogTitle>
          <DialogDescription>{session?.name}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {tiles.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {result && result.prs.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-warning">
              <Trophy className="h-4 w-4" /> New personal records
            </p>
            <ul className="space-y-1.5">
              {result.prs.map((pr) => (
                <li key={pr.exerciseId} className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{pr.exerciseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {pr.types.map((type) => PR_LABELS[type]).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button className="h-11 w-full sm:w-auto" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FinishSummaryDialog;
