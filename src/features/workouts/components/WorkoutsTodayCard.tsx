import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { relativeDate } from "@lib/date/relative";
import { nextRoutine } from "../workout-format";
import { useStartSession, useWorkoutSummary } from "../hooks/useWorkouts";

const CARD = "rounded-3xl bg-rating p-6 text-rating-foreground sm:p-7";
const INK_BUTTON =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-rating-foreground px-6 text-sm font-semibold text-rating transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rating-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-rating disabled:opacity-60";

/** The Today page's workout block: resume a live session, or start the next routine. */
function WorkoutsTodayCard() {
  const { summary, loading } = useWorkoutSummary();
  const { startSession, starting } = useStartSession();

  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-card" />;
  if (!summary) return null;

  if (summary.active) {
    return (
      <section aria-label="Workout in progress" className={CARD}>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">In progress</p>
            <p className="mt-2 truncate font-serif text-[2.5rem] leading-none">{summary.active.name}</p>
            <p className="mt-2 text-[13px]">Started {relativeDate(summary.active.startedAt).toLowerCase()}</p>
          </div>
          <Link to={`/workouts/session/${summary.active._id}`} className={INK_BUTTON}>
            Resume
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  const { thisWeek, streak, lastSession, routines } = summary;
  const next = nextRoutine(summary);
  const others = routines.filter((routine) => routine._id !== next?._id);

  if (!next) {
    return (
      <section aria-label="Training" className="panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="eyebrow">Training</p>
          <p className="mt-2 font-serif text-2xl">No routine yet</p>
        </div>
        <Link
          to="/workouts"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-secondary"
        >
          Set one up
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Up next" className={CARD}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">Up next</p>
          <p className="mt-2 truncate font-serif text-[2.5rem] leading-none">{next.name}</p>
          <p className="mt-2 text-[13px]">
            {next.exerciseCount} exercise{next.exerciseCount === 1 ? "" : "s"}
            {lastSession
              ? ` · Last: ${lastSession.name}, ${relativeDate(lastSession.startedAt).toLowerCase()}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          disabled={starting}
          onClick={() => startSession(next._id)}
          className={INK_BUTTON}
        >
          Begin session
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rating-foreground/15 pt-4 text-[13px]">
        <span>
          {thisWeek} this week
          {streak.current > 1 && (
            <span className="ml-2 inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              {streak.current} week streak
            </span>
          )}
        </span>
        {others.length > 0 && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto">
            <span className="opacity-80">or start</span>
            {others.map((routine) => (
              <button
                key={routine._id}
                type="button"
                disabled={starting}
                onClick={() => startSession(routine._id)}
                className="font-semibold underline decoration-rating-foreground/40 underline-offset-4 hover:decoration-rating-foreground disabled:opacity-60"
              >
                {routine.name}
              </button>
            ))}
          </span>
        )}
      </div>
    </section>
  );
}

export default WorkoutsTodayCard;
