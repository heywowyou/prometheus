import { Link } from "react-router-dom";
import { Dumbbell, Flame, Play } from "lucide-react";
import { relativeDate } from "@lib/date/relative";
import { useStartSession, useWorkoutSummary } from "../hooks/useWorkouts";

/** The Today page's workout block: resume, or this week plus one-tap starts. */
function WorkoutsTodayCard() {
  const { summary, loading } = useWorkoutSummary();
  const { startSession, starting } = useStartSession();

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-card" />;
  if (!summary) return null;

  if (summary.active) {
    return (
      <Link
        to={`/workouts/session/${summary.active._id}`}
        className="flex items-center gap-3 rounded-xl border border-rating/50 bg-rating/10 p-3 transition-colors hover:bg-rating/15"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rating text-rating-foreground">
          <Dumbbell className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">Workout in progress</span>
          <span className="block truncate font-medium text-foreground">{summary.active.name}</span>
        </span>
        <span className="text-sm font-medium text-rating">Resume</span>
      </Link>
    );
  }

  const { thisWeek, streak, lastSession, routines } = summary;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {thisWeek === 0
              ? "No workout yet this week"
              : `${thisWeek} workout${thisWeek === 1 ? "" : "s"} this week`}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {lastSession
              ? `Last: ${lastSession.name} · ${relativeDate(lastSession.startedAt)}`
              : "Nothing logged yet"}
          </p>
        </div>
        {streak.current > 1 && (
          <span className="flex items-center gap-1 text-sm font-semibold text-streak">
            <Flame className="h-4 w-4" />
            {streak.current} wk
          </span>
        )}
      </div>

      {routines.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {routines.map((routine) => (
            <button
              key={routine._id}
              type="button"
              disabled={starting}
              onClick={() => startSession(routine._id)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-rating/50 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current text-rating" />
              {routine.name}
            </button>
          ))}
        </div>
      ) : (
        <Link to="/workouts" className="block px-1 text-xs text-muted-foreground hover:text-foreground">
          Set up a routine →
        </Link>
      )}
    </div>
  );
}

export default WorkoutsTodayCard;
