import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";
import { cn } from "@lib/utils";
import { KIND_ICON } from "../kind-icons";
import { useExerciseActions, useExercises } from "../hooks/useWorkouts";
import {
  MUSCLE_GROUP_LABELS,
  type Exercise,
  type ExerciseKind,
} from "../types/workout-types";

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
  /** Already in the routine/session: marked, still pickable. */
  usedIds?: string[];
}


/** Bottom sheet: search the library, or create an exercise from the query. */
function ExercisePicker({ open, onClose, onPick, usedIds = [] }: ExercisePickerProps) {
  const { exercises, loading } = useExercises();
  const { createExercise, saving } = useExerciseActions();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ExerciseKind>("strength");

  const trimmed = query.trim();
  const matches = useMemo(() => {
    const q = trimmed.toLowerCase();
    return q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises;
  }, [exercises, trimmed]);
  const exact = exercises.some((e) => e.name.toLowerCase() === trimmed.toLowerCase());

  const pick = (exercise: Exercise) => {
    onPick(exercise);
    setQuery("");
    onClose();
  };

  const create = async () => {
    if (!trimmed || saving) return;
    try {
      pick(await createExercise({ name: trimmed, kind }));
    } catch {
      // Toasted by the query client; the sheet stays open to retry.
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="h-[85dvh]">
        <SheetHeader>
          <SheetTitle>Add exercise</SheetTitle>
          <SheetDescription className="sr-only">
            Search your exercises or create a new one.
          </SheetDescription>
        </SheetHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (matches.length === 1) pick(matches[0] as Exercise);
              else if (!exact) void create();
            }}
            placeholder="Search or create…"
            enterKeyHint="search"
            className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:border-rating focus:outline-none"
          />
        </div>

        <div className="-mx-4 flex-1 overflow-y-auto px-4">
          {trimmed && !exact && (
            <div className="mb-3 rounded-xl border border-dashed border-border p-3">
              <div className="mb-2 flex gap-1.5">
                {(["strength", "cardio"] as const).map((k) => {
                  const Icon = KIND_ICON[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={cn(
                        "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm capitalize transition-colors",
                        kind === k
                          ? "bg-rating text-rating-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {k}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void create()}
                className="flex h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-rating hover:bg-secondary disabled:opacity-50"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">Create “{trimmed}”</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          ) : matches.length === 0 && !trimmed ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No exercises yet — type a name to create one.
            </p>
          ) : (
            <ul className="space-y-1">
              {matches.map((exercise) => {
                const Icon = KIND_ICON[exercise.kind];
                const used = usedIds.includes(exercise._id);
                return (
                  <li key={exercise._id}>
                    <button
                      type="button"
                      onClick={() => pick(exercise)}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-secondary active:bg-secondary"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {exercise.name}
                        </span>
                        {exercise.muscleGroup && (
                          <span className="text-xs text-muted-foreground">
                            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                          </span>
                        )}
                      </span>
                      {used && <span className="text-xs text-muted-foreground">Added</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ExercisePicker;
