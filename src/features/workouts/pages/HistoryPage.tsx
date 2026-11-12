import { Link } from "react-router-dom";
import { CalendarCheck, Flame, History, Trophy } from "lucide-react";
import { Button } from "@components/ui/button";
import EmptyState from "@components/feedback/EmptyState";
import { Heatmap, heatmapDays } from "@components/ui/heatmap";
import { formatDuration } from "@lib/date/duration";
import { useSessionHistory, useWorkoutHistory } from "../hooks/useWorkouts";
import { formatSessionDate, formatVolume } from "../workout-format";
import { sessionStats, type WorkoutSession } from "../types/workout-types";

const WEEKS = 26;

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

function SessionRow({ session }: { session: WorkoutSession }) {
  const { sets, volumeKg } = sessionStats(session);
  const durationSec = session.finishedAt
    ? (new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
    : 0;
  const details = [
    formatDuration(durationSec),
    plural(sets, "set"),
    volumeKg ? formatVolume(volumeKg) : null,
  ].filter(Boolean);

  return (
    <li>
      <Link
        to={`/workouts/session/${session._id}`}
        className="block rounded-2xl border border-border bg-card p-3 transition-colors hover:border-rating/50"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold text-foreground">{session.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatSessionDate(session.startedAt)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{details.join(" · ")}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground/80">
          {session.entries.map((e) => e.exerciseName).join(" · ")}
        </p>
      </Link>
    </li>
  );
}

/** `/workouts/history`: training calendar, weekly streak, past workouts. */
function HistoryPage() {
  const { history, loading: historyLoading } = useWorkoutHistory(heatmapDays(WEEKS));
  const { sessions, loading, hasMore, loadMore, loadingMore } = useSessionHistory();

  const stats = [
    {
      icon: Flame,
      label: "Week streak",
      value: history ? plural(history.streak.current, "week") : "–",
    },
    {
      icon: Trophy,
      label: "Best streak",
      value: history ? plural(history.streak.best, "week") : "–",
    },
    { icon: CalendarCheck, label: "All-time", value: history ? String(history.total) : "–" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-secondary/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <Heatmap
        days={history?.days}
        weeks={WEEKS}
        loading={historyLoading}
        describe={(count) => (count ? plural(count, "workout") : "rest day")}
      />

      <section>
        <h3 className="section-title mb-3">Past workouts</h3>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState icon={History} message="Finished workouts will show up here." />
        ) : (
          <>
            <ul className="space-y-2">
              {sessions.map((session) => (
                <SessionRow key={session._id} session={session} />
              ))}
            </ul>
            {hasMore && (
              <Button
                variant="ghost"
                className="mt-3 h-11 w-full"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore ? "Loading…" : "Show older"}
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default HistoryPage;
