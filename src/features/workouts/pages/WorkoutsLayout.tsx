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
      className="mb-8 flex items-center gap-4 rounded-3xl bg-rating p-4 pr-5 text-rating-foreground transition-colors hover:bg-rating-hover"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rating-foreground text-rating">
        <Dumbbell className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em]">In progress</span>
        <span className="block truncate font-serif text-2xl">{active.name}</span>
      </span>
      <span className="text-sm font-medium tabular-nums">
        {formatClock(now - new Date(active.startedAt).getTime())}
      </span>
      <ChevronRight className="h-5 w-5" />
    </Link>
  );
}

/** `/workouts`: the tabbed hub (Start · History · Exercises). */
function WorkoutsLayout() {
  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="page-title mb-8 pt-2 sm:pt-6">Workouts</h1>
      <nav
        aria-label="Workouts"
        className="mb-10 grid grid-cols-3 gap-0.5 rounded-full border border-border bg-card p-1 text-[13px] sm:inline-grid"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-full px-5 transition-colors",
                isActive
                  ? "bg-primary font-semibold text-primary-foreground"
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
