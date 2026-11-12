import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ListChecks, Plus, Search } from "lucide-react";
import { Button } from "@components/ui/button";
import { Switch } from "@components/ui/switch";
import EmptyState from "@components/feedback/EmptyState";
import ExerciseDialog from "../components/ExerciseDialog";
import { useExercises } from "../hooks/useWorkouts";
import { KIND_ICON } from "../kind-icons";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUPS, type Exercise, type MuscleGroup } from "../types/workout-types";

type Group = { key: MuscleGroup | "none"; label: string; exercises: Exercise[] };

/** Library grouped by muscle group, in the enum's order; ungrouped last. */
const groupExercises = (exercises: Exercise[]): Group[] => {
  const groups: Group[] = [
    ...MUSCLE_GROUPS.map((key) => ({ key, label: MUSCLE_GROUP_LABELS[key], exercises: [] as Exercise[] })),
    { key: "none" as const, label: "No muscle group", exercises: [] },
  ];
  const byKey = new Map(groups.map((g) => [g.key, g]));
  for (const exercise of exercises) byKey.get(exercise.muscleGroup ?? "none")?.exercises.push(exercise);
  return groups.filter((g) => g.exercises.length > 0);
};

/** `/workouts/exercises`: your exercise library; tap one for its progress. */
function ExercisesPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const { exercises, loading } = useExercises({ archived: showArchived });

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupExercises(q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises);
  }, [exercises, query]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercises"
            className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:border-rating focus:outline-none"
          />
        </div>
        <Button className="h-11" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch checked={showArchived} onCheckedChange={setShowArchived} />
        Show archived
      </label>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          message={
            query
              ? "No exercise matches."
              : showArchived
                ? "No archived exercises."
                : "Your exercises appear here. You can also create them while logging."
          }
          action={showArchived || query ? undefined : { label: "New exercise", onClick: () => setCreating(true) }}
        />
      ) : (
        groups.map((group) => (
          <section key={group.key}>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {group.exercises.map((exercise, index) => {
                const Icon = KIND_ICON[exercise.kind];
                return (
                  <li key={exercise._id} className={index > 0 ? "border-t border-border" : undefined}>
                    <Link
                      to={`/workouts/exercises/${exercise._id}`}
                      className="flex min-h-12 items-center gap-3 px-3 py-2 transition-colors hover:bg-secondary"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {exercise.name}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <ExerciseDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

export default ExercisesPage;
