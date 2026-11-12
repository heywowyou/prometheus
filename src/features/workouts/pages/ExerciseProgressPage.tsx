import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  Ellipsis,
  LineChart,
  Pencil,
  Trash2,
  Trophy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import EmptyState from "@components/feedback/EmptyState";
import PageLoader from "@components/feedback/PageLoader";
import { formatDuration } from "@lib/date/duration";
import { cn } from "@lib/utils";
import ExerciseDialog from "../components/ExerciseDialog";
import ProgressChart, { type ChartPoint } from "../components/ProgressChart";
import { useExerciseActions, useExerciseMap, useExerciseProgress } from "../hooks/useWorkouts";
import {
  describeSet,
  formatDistance,
  formatPace,
  formatSessionDate,
  formatVolume,
  formatWeight,
} from "../workout-format";
import {
  MUSCLE_GROUP_LABELS,
  PR_LABELS,
  PR_TYPES,
  type ExerciseMetrics,
  type ExerciseProgress,
  type PrType,
} from "../types/workout-types";

interface Metric {
  key: PrType;
  label: string;
  pick: (m: ExerciseMetrics) => number | null;
  format: (value: number) => string;
  invert?: boolean;
}

const strengthOnly = <T,>(fn: (m: Extract<ExerciseMetrics, { kind: "strength" }>) => T) =>
  (m: ExerciseMetrics): T | null => (m.kind === "strength" ? fn(m) : null);
const cardioOnly = <T,>(fn: (m: Extract<ExerciseMetrics, { kind: "cardio" }>) => T) =>
  (m: ExerciseMetrics): T | null => (m.kind === "cardio" ? fn(m) : null);

const METRICS: Record<PrType, Metric> = {
  e1rm: { key: "e1rm", label: "Est. 1RM", pick: strengthOnly((m) => m.e1rmKg || null), format: formatWeight },
  weight: { key: "weight", label: "Top weight", pick: strengthOnly((m) => m.bestWeightKg || null), format: formatWeight },
  volume: { key: "volume", label: "Volume", pick: strengthOnly((m) => m.volumeKg || null), format: formatVolume },
  reps: { key: "reps", label: "Reps", pick: strengthOnly((m) => m.maxReps || null), format: (v) => `${v} reps` },
  distance: { key: "distance", label: "Distance", pick: cardioOnly((m) => m.distanceM || null), format: formatDistance },
  duration: { key: "duration", label: "Time", pick: cardioOnly((m) => m.durationSec || null), format: formatDuration },
  pace: { key: "pace", label: "Pace", pick: cardioOnly((m) => m.paceSecPerKm), format: formatPace, invert: true },
};

/** Metrics with at least one data point, in a sensible order per kind. */
const availableMetrics = (progress: ExerciseProgress): Metric[] => {
  const order: PrType[] =
    progress.exercise.kind === "strength"
      ? ["e1rm", "weight", "volume", "reps"]
      : ["distance", "pace", "duration"];
  return order
    .map((key) => METRICS[key])
    .filter((metric) => progress.points.some((p) => metric.pick(p.metrics) !== null));
};

function ProgressView({ progress }: { progress: ExerciseProgress }) {
  const metrics = useMemo(() => availableMetrics(progress), [progress]);
  const [chosen, setChosen] = useState<PrType | null>(null);
  const metric = metrics.find((m) => m.key === chosen) ?? metrics[0];

  const points: ChartPoint[] = useMemo(
    () =>
      metric
        ? progress.points.flatMap((p) => {
            const value = metric.pick(p.metrics);
            return value === null ? [] : [{ date: p.date, value }];
          })
        : [],
    [metric, progress],
  );

  const records = PR_TYPES.filter((type) => progress.records[type] !== undefined);
  const recent = progress.points.slice(-10).reverse();

  if (progress.points.length === 0) {
    return (
      <EmptyState icon={LineChart} message="Finish a workout with this exercise to see its progress." />
    );
  }

  return (
    <div className="space-y-6">
      {metric && (
        <section className="rounded-2xl border border-border bg-card p-3">
          {metrics.length > 1 && (
            <div className="mb-3 flex gap-1 overflow-x-auto">
              {metrics.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setChosen(m.key)}
                  className={cn(
                    "h-9 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors",
                    m.key === metric.key
                      ? "bg-rating text-rating-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
          <ProgressChart points={points} format={metric.format} invert={metric.invert} />
        </section>
      )}

      {records.length > 0 && (
        <section>
          <h3 className="section-title mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" /> Records
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {records.map((type) => (
              <div key={type} className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">{PR_LABELS[type]}</p>
                <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
                  {METRICS[type].format(progress.records[type] as number)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="section-title mb-3">Recent</h3>
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          {recent.map((point, index) => {
            const m = point.metrics;
            const summary =
              m.kind === "strength"
                ? m.bestSet
                  ? `Best set ${describeSet("strength", m.bestSet)}${m.volumeKg ? ` · ${formatVolume(m.volumeKg)}` : ""}`
                  : "–"
                : describeSet("cardio", { distanceM: m.distanceM, durationSec: m.durationSec }) +
                  (m.paceSecPerKm ? ` · ${formatPace(m.paceSecPerKm)}` : "");
            return (
              <li key={point.sessionId} className={index > 0 ? "border-t border-border" : undefined}>
                <Link
                  to={`/workouts/session/${point.sessionId}`}
                  className="flex items-center justify-between gap-3 px-3 py-3 text-sm transition-colors hover:bg-secondary"
                >
                  <span className="text-muted-foreground">{formatSessionDate(point.date)}</span>
                  <span className="truncate tabular-nums text-foreground">{summary}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** `/workouts/exercises/:id`: one exercise's chart, records and recent sessions. */
function ExerciseProgressPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { progress, loading } = useExerciseProgress(id);
  const { map } = useExerciseMap();
  const { updateExercise, deleteExercise } = useExerciseActions();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exercise = id ? map.get(id) : undefined;

  if (loading) return <PageLoader />;
  if (!progress) {
    return (
      <EmptyState
        icon={LineChart}
        message="This exercise doesn't exist any more."
        action={{ label: "Back to exercises", onClick: () => navigate("/workouts/exercises") }}
      />
    );
  }

  const remove = async () => {
    setConfirmDelete(false);
    try {
      const { archived } = await deleteExercise(progress.exercise._id);
      if (!archived) navigate("/workouts/exercises", { replace: true });
    } catch {
      // Toasted by the query client.
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5 flex items-start gap-2">
        <Link
          to="/workouts/exercises"
          aria-label="Back"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold tracking-tight text-foreground">
            {progress.exercise.name}
          </h2>
          <p className="text-xs capitalize text-muted-foreground">
            {progress.exercise.kind}
            {progress.exercise.muscleGroup && ` · ${MUSCLE_GROUP_LABELS[progress.exercise.muscleGroup]}`}
            {exercise?.archived && " · archived"}
          </p>
        </div>
        {exercise && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Exercise options"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Ellipsis className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              {exercise.archived ? (
                <DropdownMenuItem
                  onSelect={() =>
                    void updateExercise({ id: exercise._id, payload: { archived: false } }).catch(
                      () => undefined,
                    )
                  }
                >
                  <ArchiveRestore className="h-4 w-4" /> Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  {progress.points.length > 0 ? (
                    <>
                      <Archive className="h-4 w-4" /> Archive
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" /> Delete
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <ProgressView progress={progress} />

      <ExerciseDialog open={editing} onClose={() => setEditing(false)} exercise={exercise} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
        title={`Remove “${progress.exercise.name}”?`}
        description="Exercises with logged workouts or used in a routine are archived instead: hidden from pickers, history kept."
        confirmLabel="Remove"
      />
    </div>
  );
}

export default ExerciseProgressPage;
