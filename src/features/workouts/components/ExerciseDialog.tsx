import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import { useExerciseActions } from "../hooks/useWorkouts";
import { KIND_ICON } from "../kind-icons";
import {
  EXERCISE_KINDS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  type Exercise,
  type ExerciseKind,
  type MuscleGroup,
} from "../types/workout-types";

interface ExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  /** Edit this one; omit to create. */
  exercise?: Exercise;
}

function ExerciseForm({ exercise, onClose }: { exercise?: Exercise; onClose: () => void }) {
  const { createExercise, updateExercise, saving } = useExerciseActions();
  const [name, setName] = useState(exercise?.name ?? "");
  const [kind, setKind] = useState<ExerciseKind>(exercise?.kind ?? "strength");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">(exercise?.muscleGroup ?? "");
  const [notes, setNotes] = useState(exercise?.notes ?? "");

  const submit = async () => {
    const payload = {
      name: name.trim(),
      kind,
      muscleGroup: muscleGroup || null,
      notes: notes.trim(),
    };
    if (!payload.name) return;
    try {
      if (exercise) await updateExercise({ id: exercise._id, payload });
      else await createExercise(payload);
      onClose();
    } catch {
      // Toasted by the query client (e.g. a duplicate name); keep the form open.
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <DialogHeader>
        <DialogTitle>{exercise ? "Edit exercise" : "New exercise"}</DialogTitle>
        <DialogDescription className="sr-only">Name, type and muscle group.</DialogDescription>
      </DialogHeader>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name, e.g. Bench press"
        maxLength={80}
        autoFocus
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-rating focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        {EXERCISE_KINDS.map((k) => {
          const Icon = KIND_ICON[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium capitalize transition-colors",
                kind === k ? "bg-rating text-rating-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {k}
            </button>
          );
        })}
      </div>

      <select
        value={muscleGroup}
        onChange={(event) => setMuscleGroup(event.target.value as MuscleGroup | "")}
        aria-label="Muscle group"
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground focus:border-rating focus:outline-none"
      >
        <option value="">Muscle group (optional)</option>
        {MUSCLE_GROUPS.map((group) => (
          <option key={group} value={group}>
            {MUSCLE_GROUP_LABELS[group]}
          </option>
        ))}
      </select>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notes: seat height, grip…"
        rows={2}
        maxLength={1000}
        className="w-full resize-none rounded-xl border border-input bg-background p-3 text-base text-foreground placeholder:text-muted-foreground focus:border-rating focus:outline-none"
      />

      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" className="h-11" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="h-11" disabled={saving || !name.trim()}>
          {exercise ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Create and edit share this dialog. */
function ExerciseDialog({ open, onClose, exercise }: ExerciseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {open && <ExerciseForm key={exercise?._id ?? "new"} exercise={exercise} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

export default ExerciseDialog;
