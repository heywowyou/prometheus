import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { cn } from "@lib/utils";
import {
  MAX_DURATION_GOAL,
  type InteractionType,
  type RecurrenceType,
  type Todo,
} from "../types/todo-types";

type HabitCadence = Exclude<RecurrenceType, "none">;

interface HabitFormValues {
  text: string;
  recurrenceType: HabitCadence;
  /** Daily habits: 7 = every day, otherwise days a week. */
  perWeek: number;
  interactionType: InteractionType;
  durationGoal: string;
}

const initialValues = (task: Todo | null, defaultRecurrence: HabitCadence): HabitFormValues => ({
  text: task?.text ?? "",
  recurrenceType: task && task.recurrenceType !== "none" ? task.recurrenceType : defaultRecurrence,
  perWeek: task?.perWeek ?? 7,
  interactionType: task?.interactionType ?? "checkbox",
  durationGoal: task?.durationGoal ? String(task.durationGoal) : "",
});

const CADENCES: Array<{ value: HabitCadence; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const DAYS_A_WEEK = [7, 6, 5, 4, 3, 2, 1];

export interface TaskSubmitValues {
  text: string;
  recurrenceType: RecurrenceType;
  interactionType: InteractionType;
  durationGoal: number;
  /** Always null for habits; kept for the create payload's shape. */
  dueDate: string | null;
  /** Daily habits: days a week, or null for every day. */
  perWeek: number | null;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass a habit to edit it; omit to create a new one. */
  task?: Todo | null;
  onSubmit: (values: TaskSubmitValues) => Promise<unknown>;
  /** Cadence preselected for a new habit. */
  defaultRecurrence?: RecurrenceType;
}

type BodyProps = Omit<TaskModalProps, "isOpen">;

function TaskModalBody({ onClose, task = null, onSubmit, defaultRecurrence }: BodyProps) {
  const isEdit = task !== null;
  const [values, setValues] = useState<HabitFormValues>(() =>
    initialValues(task, defaultRecurrence && defaultRecurrence !== "none" ? defaultRecurrence : "daily"),
  );
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof HabitFormValues>(key: K, value: HabitFormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const isTimer = values.interactionType === "timer";
  const minutes = Math.min(MAX_DURATION_GOAL, Math.max(0, Math.floor(Number(values.durationGoal) || 0)));
  const missingGoal = isTimer && minutes < 1;
  const canSubmit = values.text.trim() !== "" && !missingGoal && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        text: values.text.trim(),
        recurrenceType: values.recurrenceType,
        interactionType: values.interactionType,
        durationGoal: minutes,
        dueDate: null,
        perWeek: values.recurrenceType === "daily" && values.perWeek < 7 ? values.perWeek : null,
      });
      onClose();
    } catch {
      // Already toasted by the query client; stay open so nothing is lost.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit habit" : "New habit"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="habit-text">Habit</Label>
          <Input
            id="habit-text"
            type="text"
            placeholder="Read, stretch, gym…"
            value={values.text}
            onChange={(event) => set("text", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label>Resets</Label>
          <div className="flex gap-1.5">
            {CADENCES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => set("recurrenceType", option.value)}
                className={cn(
                  "flex-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  values.recurrenceType === option.value
                    ? "border-rating bg-rating/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {values.recurrenceType === "daily" && (
          <div className="space-y-1.5">
            <Label>How often</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_A_WEEK.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => set("perWeek", count)}
                  aria-pressed={values.perWeek === count}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs tabular-nums transition-colors",
                    values.perWeek === count
                      ? "border-rating bg-rating/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {count === 7 ? "Every day" : `${count}×`}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {values.perWeek === 7
                ? "Every day. You can still skip a day from its menu without it counting against you."
                : `${values.perWeek} days a week, any days you like. The other days are rest days.`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={values.interactionType} onValueChange={(value) => set("interactionType", value as InteractionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="timer">Timer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="habit-duration">{isTimer ? "Target (min) *" : "Minutes (optional)"}</Label>
            <Input
              id="habit-duration"
              type="number"
              inputMode="numeric"
              min={isTimer ? 1 : 0}
              max={MAX_DURATION_GOAL}
              placeholder={isTimer ? "30" : "-"}
              value={values.durationGoal}
              onChange={(event) => set("durationGoal", event.target.value)}
              aria-invalid={missingGoal && values.durationGoal !== ""}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {isTimer
            ? "Start the timer when you begin; the habit ticks itself once the target is reached."
            : "Tick it when it's done. Minutes, if set, are shown as a reminder."}
        </p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
        </Button>
      </DialogFooter>
    </>
  );
}

/** One modal for creating and editing a habit. */
function TaskModal({ isOpen, ...rest }: TaskModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && rest.onClose()}>
      <DialogContent className="max-w-sm">
        {isOpen && <TaskModalBody key={rest.task?._id ?? "new"} {...rest} />}
      </DialogContent>
    </Dialog>
  );
}

export default TaskModal;
