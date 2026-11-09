import { useState } from "react";
import { toast } from "sonner";
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
import { getErrorMessage } from "@lib/api/errors";
import { RECURRENCE_TYPES, RECURRENCE_LABELS } from "@lib/date/recurrence";
import type {
  InteractionType,
  RecurrenceType,
  Todo,
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
        durationGoal: String(task.durationGoal ?? 0),
      }
    : {
        text: "",
        recurrenceType: "none",
        interactionType: "checkbox",
        durationGoal: "0",
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

  const isHold = values.interactionType === "hold";

  const handleSubmit = async () => {
    if (!values.text.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        text: values.text.trim(),
        recurrenceType: values.recurrenceType,
        interactionType: values.interactionType,
        // The target only applies to hold tasks.
        durationGoal: isHold ? Math.max(0, Number(values.durationGoal) || 0) : 0,
      });
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
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
                <SelectItem value="hold">Hold to fill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className={cn("space-y-1.5", !isHold && "pointer-events-none opacity-30")}
          >
            <Label htmlFor="task-duration">Target (mins)</Label>
            <Input
              id="task-duration"
              type="number"
              min={0}
              value={values.durationGoal}
              onChange={(event) => set("durationGoal", event.target.value)}
              disabled={!isHold}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          disabled={!values.text.trim() || submitting}
        >
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
