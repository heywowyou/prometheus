import { Link, NavLink, Outlet } from "react-router-dom";
import { ChevronRight, Dumbbell, History, ListChecks, Play } from "lucide-react";
import { formatClock } from "@lib/date/duration";
import { useNow } from "@lib/hooks/useNow";
import { cn } from "@lib/utils";
import { useActiveSession } from "../hooks/useWorkouts";

const TABS = [
  { to: "/workouts", label: "Start", icon: Play, end: true },
  { to: "/workouts/history", label: "History", icon: History, end: false },
  { to: "/workouts/exercises", label: "Exercises", icon: ListChecks, end: false },
] as const;

/** "Resume" card, shown on every tab while a workout is live. */
function ActiveSessionBanner() {
  const { active } = useActiveSession();
  const now = useNow(active !== null);
  if (!active) return null;

  return (
    <Link
      to={`/workouts/session/${active._id}`}
      className="mb-5 flex items-center gap-3 rounded-2xl border border-rating/50 bg-rating/10 p-3 transition-colors hover:bg-rating/15"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rating text-rating-foreground">
        <Dumbbell className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">Workout in progress</span>
        <span className="block truncate font-semibold text-foreground">{active.name}</span>
      </span>
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatClock(now - new Date(active.startedAt).getTime())}
      </span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

/** `/workouts`: the tabbed hub (Start · History · Exercises). */
function WorkoutsLayout() {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="page-title mb-4">Workouts</h2>
      <nav className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1 text-sm">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-rating text-rating-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <ActiveSessionBanner />
      <Outlet />
    </div>
  );
}

export default WorkoutsLayout;
