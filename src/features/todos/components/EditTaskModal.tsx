import { useState, useEffect } from "react";
import type { Todo, RecurrenceType } from "../types/todo-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Todo | null;
  onUpdate: (
    id: string,
    updates: {
      text: string;
      recurrenceType: RecurrenceType;
      interactionType: Todo["interactionType"];
      durationGoal: number;
    }
  ) => void;
}

function EditTaskModal({
  isOpen,
  onClose,
  task,
  onUpdate,
}: EditTaskModalProps) {
  const [text, setText] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [interactionType, setInteractionType] =
    useState<Todo["interactionType"]>("checkbox");
  const [durationGoal, setDurationGoal] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setText(task.text);
      setRecurrence(task.recurrenceType || "none");
      setInteractionType(task.interactionType || "checkbox");
      setDurationGoal(task.durationGoal || 0);
    }
  }, [task, isOpen]);

  const handleSave = () => {
    if (!task || !text.trim()) return;

    onUpdate(task._id, {
      text,
      recurrenceType: recurrence,
      interactionType,
      durationGoal: Number(durationGoal),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen && task !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <Select
              value={recurrence}
              onValueChange={(value) => setRecurrence(value as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-Time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select
                value={interactionType}
                onValueChange={(value) =>
                  setInteractionType(value as Todo["interactionType"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="hold">Hold to Fill</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={
                interactionType === "hold"
                  ? "space-y-1.5 opacity-100"
                  : "space-y-1.5 opacity-30 pointer-events-none"
              }
            >
              <Label>Target (Mins)</Label>
              <Input
                type="number"
                min={1}
                value={durationGoal}
                onChange={(e) => setDurationGoal(Number(e.target.value))}
                disabled={interactionType !== "hold"}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!text.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditTaskModal;
