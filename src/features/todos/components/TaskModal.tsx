import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { RECURRENCE_TYPES, RECURRENCE_LABELS } from "@lib/date/recurrence";
import {
  MAX_DURATION_GOAL,
  type InteractionType,
  type RecurrenceType,
  type Todo,
} from "../types/todo-types";

interface TaskFormValues {
  text: string;
  recurrenceType: RecurrenceType;
  interactionType: InteractionType;
  durationGoal: string;
}

const initialValues = (task: Todo | null): TaskFormValues =>
  task
    ? {
        text: task.text,
        recurrenceType: task.recurrenceType,
        interactionType: task.interactionType,
        durationGoal: task.durationGoal ? String(task.durationGoal) : "",
      }
    : {
        text: "",
        recurrenceType: "none",
        interactionType: "checkbox",
        durationGoal: "",
      };

const RECURRENCE_OPTIONS = RECURRENCE_TYPES.map((value) => ({
  value,
  label: value === "none" ? "One-time task" : RECURRENCE_LABELS[value],
}));

export interface TaskSubmitValues {
  text: string;
  recurrenceType: RecurrenceType;
  interactionType: InteractionType;
  durationGoal: number;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass a task to edit it; omit to create a new one. */
  task?: Todo | null;
  onSubmit: (values: TaskSubmitValues) => Promise<unknown>;
}

type BodyProps = Omit<TaskModalProps, "isOpen">;

/** Mounted only while open, so its state is seeded from props on mount. */
function TaskModalBody({ onClose, task = null, onSubmit }: BodyProps) {
  const isEdit = task !== null;
  const [values, setValues] = useState<TaskFormValues>(() => initialValues(task));
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const isTimer = values.interactionType === "timer";
  const minutes = Math.min(MAX_DURATION_GOAL, Math.max(0, Math.floor(Number(values.durationGoal) || 0)));
  const missingGoal = isTimer && minutes < 1;

  // Switching a recurring task to one-time deletes its completion history.
  const erasesHistory =
    isEdit &&
    task.recurrenceType !== "none" &&
    values.recurrenceType === "none" &&
    task.completionCount > 0;

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
        <DialogTitle>{isEdit ? "Edit task" : "Create new task"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="task-text">Description</Label>
          <Input
            id="task-text"
            type="text"
            placeholder="What needs to be done?"
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
          <Label>Recurrence</Label>
          <Select
            value={values.recurrenceType}
            onValueChange={(value) =>
              set("recurrenceType", value as RecurrenceType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erasesHistory && (
            <p className="flex items-start gap-1.5 pt-1 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Making this a one-time task permanently erases its{" "}
              {task.completionCount} completions and its streak.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select
              value={values.interactionType}
              onValueChange={(value) =>
                set("interactionType", value as InteractionType)
              }
            >
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
            <Label htmlFor="task-duration">
              {isTimer ? "Target (min) *" : "Minutes (optional)"}
            </Label>
            <Input
              id="task-duration"
              type="number"
              inputMode="numeric"
              min={isTimer ? 1 : 0}
              max={MAX_DURATION_GOAL}
              placeholder={isTimer ? "30" : "—"}
              value={values.durationGoal}
              onChange={(event) => set("durationGoal", event.target.value)}
              aria-invalid={missingGoal && values.durationGoal !== ""}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {isTimer
            ? "Start the timer when you begin; the task ticks itself once the target is reached. Progress syncs across devices."
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

/** One modal for creating and editing a task. */
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
