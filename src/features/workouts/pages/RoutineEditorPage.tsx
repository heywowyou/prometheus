import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronLeft, ClipboardList, Minus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import ConfirmDialog from "@components/feedback/ConfirmDialog";
import EmptyState from "@components/feedback/EmptyState";
import PageLoader from "@components/feedback/PageLoader";
import { cn } from "@lib/utils";
import ExercisePicker from "../components/ExercisePicker";
import NumberField from "../components/NumberField";
import { useExerciseMap, useRoutine, useRoutineActions } from "../hooks/useWorkouts";
import { KIND_ICON } from "../kind-icons";
import { REST_OPTIONS, restLabel } from "../workout-format";
import {
  DEFAULT_REST_SEC,
  MAX_SETS,
  type Exercise,
  type Routine,
  type RoutineExercise,
} from "../types/workout-types";

const MAX_ROUTINE_EXERCISES = 30;

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30";

interface SlotCardProps {
  slot: RoutineExercise;
  exercise: Exercise | undefined;
  isFirst: boolean;
  isLast: boolean;
  onChange: (slot: RoutineExercise) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

/** One exercise in the routine: how many sets, the targets, the rest. */
function SlotCard({ slot, exercise, isFirst, isLast, onChange, onMove, onRemove }: SlotCardProps) {
  const kind = exercise?.kind ?? "strength";
  const Icon = KIND_ICON[kind];
  const patch = (next: Partial<RoutineExercise>) => onChange({ ...slot, ...next });

  return (
    <li className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
          {exercise?.name ?? "Unknown exercise"}
        </span>
        <button type="button" aria-label="Move up" disabled={isFirst} onClick={() => onMove(-1)} className={iconButton}>
          <ArrowUp className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Move down" disabled={isLast} onClick={() => onMove(1)} className={iconButton}>
          <ArrowDown className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Remove" onClick={onRemove} className={cn(iconButton, "hover:text-destructive")}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-muted-foreground sm:grid-cols-4">
        <div>
          <span className="mb-1 block">Sets</span>
          <div className="flex h-11 items-center justify-between rounded-lg border border-input bg-background">
            <button
              type="button"
              aria-label="Fewer sets"
              disabled={slot.sets <= 1}
              onClick={() => patch({ sets: slot.sets - 1 })}
              className="flex h-full w-10 items-center justify-center disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-base font-semibold tabular-nums text-foreground">{slot.sets}</span>
            <button
              type="button"
              aria-label="More sets"
              disabled={slot.sets >= MAX_SETS}
              onClick={() => patch({ sets: slot.sets + 1 })}
              className="flex h-full w-10 items-center justify-center disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {kind === "strength" ? (
          <>
            <label>
              <span className="mb-1 block">Reps</span>
              <NumberField
                integer
                label="Target reps"
                value={slot.targetReps}
                placeholder="–"
                onChange={(targetReps) => patch({ targetReps })}
              />
            </label>
            <label>
              <span className="mb-1 block">kg</span>
              <NumberField
                label="Target weight in kg"
                value={slot.targetWeightKg}
                placeholder="–"
                onChange={(targetWeightKg) => patch({ targetWeightKg })}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              <span className="mb-1 block">km</span>
              <NumberField
                label="Target distance in km"
                value={slot.targetDistanceM !== undefined ? slot.targetDistanceM / 1000 : undefined}
                placeholder="–"
                onChange={(km) =>
                  patch({ targetDistanceM: km === undefined ? undefined : Math.round(km * 1000) })
                }
              />
            </label>
            <label>
              <span className="mb-1 block">min</span>
              <NumberField
                label="Target duration in minutes"
                value={slot.targetDurationSec !== undefined ? slot.targetDurationSec / 60 : undefined}
                placeholder="–"
                onChange={(min) =>
                  patch({ targetDurationSec: min === undefined ? undefined : Math.round(min * 60) })
                }
              />
            </label>
          </>
        )}

        <label>
          <span className="mb-1 block">Rest</span>
          <select
            value={slot.restSec}
            onChange={(event) => patch({ restSec: Number(event.target.value) })}
            className="h-11 w-full rounded-lg border border-input bg-background px-2 text-base text-foreground focus:border-rating focus:outline-none"
          >
            {REST_OPTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {restLabel(sec)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}

/** Create and edit share this form (one editor, no "edit" fork). */
function RoutineForm({ routine }: { routine: Routine | undefined }) {
  const navigate = useNavigate();
  const { map: exercises } = useExerciseMap();
  const { createRoutine, updateRoutine, deleteRoutine, saving } = useRoutineActions();

  const [name, setName] = useState(routine?.name ?? "");
  const [notes, setNotes] = useState(routine?.notes ?? "");
  const [slots, setSlots] = useState<RoutineExercise[]>(routine?.exercises ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateSlot = (index: number, slot: RoutineExercise) =>
    setSlots((current) => current.map((s, i) => (i === index ? slot : s)));

  const moveSlot = (index: number, direction: -1 | 1) =>
    setSlots((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target] as RoutineExercise, next[index] as RoutineExercise];
      return next;
    });

  const addExercise = (exercise: Exercise) =>
    setSlots((current) => [
      ...current,
      {
        exerciseId: exercise._id,
        sets: exercise.kind === "strength" ? 3 : 1,
        restSec: exercise.kind === "strength" ? DEFAULT_REST_SEC : 0,
      },
    ]);

  const save = async () => {
    const payload = { name: name.trim(), notes: notes.trim(), exercises: slots };
    if (!payload.name) {
      toast.error("Give the routine a name");
      return;
    }
    if (routine) await updateRoutine({ id: routine._id, payload });
    else await createRoutine(payload);
    toast.success(routine ? "Routine saved" : "Routine created");
    navigate("/workouts");
  };

  const remove = async () => {
    if (!routine) return;
    setConfirmDelete(false);
    await deleteRoutine(routine._id);
    toast.success("Routine deleted");
    navigate("/workouts", { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-4 flex items-center gap-2">
        <Link
          to="/workouts"
          aria-label="Back"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h2 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight text-foreground">
          {routine ? "Edit routine" : "New routine"}
        </h2>
        <Button className="h-10" disabled={saving} onClick={() => void save().catch(() => undefined)}>
          Save
        </Button>
      </header>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name, e.g. Push day"
          maxLength={80}
          autoFocus={!routine}
          className="h-12 w-full rounded-xl border border-input bg-card px-3 text-base font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:border-rating focus:outline-none"
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          maxLength={1000}
          className="w-full resize-none rounded-xl border border-input bg-card p-3 text-base text-foreground placeholder:text-muted-foreground focus:border-rating focus:outline-none"
        />
      </div>

      <h3 className="section-title mb-3 mt-6">Exercises</h3>
      {slots.length === 0 ? (
        <p className="mb-3 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Add the exercises you do in this routine, in order.
        </p>
      ) : (
        <ol className="mb-3 space-y-2">
          {slots.map((slot, index) => (
            <SlotCard
              key={`${slot.exerciseId}-${index}`}
              slot={slot}
              exercise={exercises.get(slot.exerciseId)}
              isFirst={index === 0}
              isLast={index === slots.length - 1}
              onChange={(next) => updateSlot(index, next)}
              onMove={(direction) => moveSlot(index, direction)}
              onRemove={() => setSlots((current) => current.filter((_, i) => i !== index))}
            />
          ))}
        </ol>
      )}

      <Button
        variant="secondary"
        className="h-12 w-full text-base"
        disabled={slots.length >= MAX_ROUTINE_EXERCISES}
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="h-5 w-5" /> Add exercise
      </Button>

      {routine && (
        <Button
          variant="ghost"
          className="mt-8 h-11 w-full text-destructive hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" /> Delete routine
        </Button>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        usedIds={slots.map((s) => s.exerciseId)}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
        title={`Delete “${routine?.name}”?`}
        description="Workouts already done from it stay in your history."
        confirmLabel="Delete"
      />
    </div>
  );
}

/** `/workouts/routines/:id` (`new` to create). */
function RoutineEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const { routine, loading } = useRoutine(isNew ? undefined : id);

  if (!isNew && loading) return <PageLoader />;
  if (!isNew && !routine) {
    return (
      <EmptyState
        icon={ClipboardList}
        message="This routine doesn't exist any more."
        action={{ label: "Back to workouts", onClick: () => navigate("/workouts") }}
      />
    );
  }
  return <RoutineForm key={routine?._id ?? "new"} routine={routine} />;
}

export default RoutineEditorPage;
